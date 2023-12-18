import {
    Grid,
    Plugin,
    SchemaComponent,
    SchemaInitializer,
    useSchemaInitializer,
  } from '@digiforce-nc/client';
  import { createApp } from '../app';
  
  const HomePage = () => {
    return (
      <SchemaComponent
        schema={{
          name: 'root',
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'myInitializer',
        }}
      />
    );
  };
  
  class PluginDemoAddSchemaInitializer extends Plugin {
    async load() {
      // Register global components
      this.app.addComponents({ Grid, HomePage });
      const myInitializer = new SchemaInitializer({
        name: 'myInitializer',
        title: 'Add block',
        wrap: Grid.wrap,
        items: [
          {
            name: 'helloBlock',
            type: 'item',
            useComponentProps() {
              const { insert } = useSchemaInitializer();
              return {
                title: 'Hello',
                onClick: () => {
                  insert({
                    type: 'void',
                    'x-decorator': 'CardItem',
                    'x-component': 'h1',
                    'x-content': 'Hello, world!',
                  });
                },
              };
            },
          },
        ],
      });
      this.schemaInitializerManager.add(myInitializer);
    }
  }
  
  // Quickly sample an App
  const app = createApp({ plugins: [PluginDemoAddSchemaInitializer] });
  
  export default app.getRootComponent();
  