import { CodeBlock } from '../ui/code-block'
import { BlurFade } from '../reactbits'

const hostCode = `import { useAspectlyIframe } from '@aspectly/web';

function App() {
  const [bridge, loaded, Iframe] = useAspectlyIframe({
    url: 'https://widget.example.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        getUserData: async () => ({
          name: 'John Doe',
          role: 'Admin'
        })
      });
    }
  }, [loaded]);

  return <Iframe style={{ width: '100%', height: 400 }} />;
}`

const widgetCode = `import { AspectlyBridge } from '@aspectly/core';

const bridge = new AspectlyBridge();

await bridge.init({
  greet: async ({ name }) => ({
    message: \`Hello, \${name}!\`
  })
});

// Call the host app
const user = await bridge.send('getUserData');
console.log(user.name); // "John Doe"`

export function Examples() {
  return (
    <section id="examples" className="py-24">
      <div className="container px-4 mx-auto">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple to Use
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Two sides, one API. Define handlers on each side and call them from the other.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Host App
              </h3>
              <CodeBlock
                code={hostCode}
                language="typescript"
                filename="App.tsx"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Widget
              </h3>
              <CodeBlock
                code={widgetCode}
                language="typescript"
                filename="widget.ts"
              />
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
