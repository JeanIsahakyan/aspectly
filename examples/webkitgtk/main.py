#!/usr/bin/env python3
"""Aspectly bridge example for Python + WebKitGTK (Linux desktop).

Run:  python3 examples/webkitgtk/main.py
Requires: PyGObject + WebKit2GTK (e.g. apt install python3-gi gir1.2-webkit2-4.1)
"""

import os
import platform
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, WebKit2, GLib  # noqa: E402

# Allow running from a checkout without installing the package.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "python"))

from aspectly_bridge import BridgeHost, ConsoleLogger  # noqa: E402
from aspectly_bridge.webkitgtk import WebKitGTKBrowserBridge  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, "web", "index.html")


class ExampleWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="Aspectly WebKitGTK Example")
        self.set_default_size(820, 720)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        self.add(box)

        # Native -> JS buttons.
        controls = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        controls.set_margin_top(8)
        controls.set_margin_start(8)
        for label, method, params in (
            ("greet()", "greet", {"name": "Python"}),
            ("getTime()", "getTime", None),
            ("calculate()", "calculate", {"a": 5, "b": 3}),
        ):
            btn = Gtk.Button(label=label)
            btn.connect("clicked", self._on_call, method, params)
            controls.pack_start(btn, False, False, 0)
        box.pack_start(controls, False, False, 0)

        self.status = Gtk.Label(label="Native (Python) -> call into the web (JS)")
        self.status.set_xalign(0)
        self.status.set_margin_start(8)
        box.pack_start(self.status, False, False, 0)

        self.web_view = WebKit2.WebView()
        box.pack_start(self.web_view, True, True, 0)

        # Wire up the bridge.
        self.browser_bridge = WebKitGTKBrowserBridge(self.web_view)
        self.bridge = BridgeHost(self.browser_bridge, logger=ConsoleLogger())
        self._register_handlers()

        self.web_view.connect("load-changed", self._on_load_changed)
        self._initialized = False
        self.web_view.load_uri("file://" + INDEX)

        self.connect("destroy", self._on_destroy)

    def _register_handlers(self):
        self.bridge.register_handler("ping", lambda p: "pong")
        self.bridge.register_handler("echo", lambda p: p["message"])
        self.bridge.register_handler("add", lambda p: p["a"] + p["b"])
        self.bridge.register_handler("getSystemInfo", lambda p: {
            "platform": "Python " + platform.python_version(),
            "system": platform.system(),
        })

    def _on_load_changed(self, web_view, event):
        if event == WebKit2.LoadEvent.FINISHED and not self._initialized:
            self._initialized = True
            self.bridge.initialize()

    def _on_call(self, _button, method, params):
        future = self.bridge.send(method, params)

        def done(f):
            try:
                result = f.result()
                text = "Python -> JS  %s -> %s" % (method, result)
            except Exception as e:  # noqa: BLE001
                text = "Error: %s" % e
            GLib.idle_add(self.status.set_text, text)

        future.add_done_callback(done)

    def _on_destroy(self, *_args):
        self.bridge.dispose()
        Gtk.main_quit()


def main():
    win = ExampleWindow()
    win.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
