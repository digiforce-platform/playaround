import { Application } from "@digiforce-nc/server";
const app = new Application({
  database: {
    logging: process.env.DB_LOGGING === "on" ? console.log : false,
    dialect: "sqlite",
    storage: "db.sqlite",
    tablePrefix: `t_ab_le_`,
  },
  resourcer: {
    prefix: "/api",
  },
  plugins: [],
});
type User = {
    name: string,
    age: number
}
// Define Collection
const UserCollection = app.db.collection<User>({
  name: "users",
  fields: [
    {
      name: "name",
      type: "string",
    },
    {
      name: "age",
      type: "integer",
    },
  ],
});
await app.db.sync();
app.acl.allow("test", "list", "public");

const UserRepository = UserCollection.repository

// Create
await UserRepository.create({
    name: 'khacs',
    age: 18
})

const users = await UserRepository.findOne({
    // filter: {
    //   name: 'khacs',
    // },
  });
console.log(users)

// Defines a test resource and provides the corresponding list method
app.resource({
  name: "test",
  actions: {
    async list(ctx, next) {
      ctx.body = "test list";
      await next();
    //   process.stdout.write("rs");
    },
  },
});

app.listen(18118, () => {
  console.log("Digiforce started");
  console.log("Open:", "http://localhost:18118/api/test:list");
});
