import { Hono } from "hono";
import { getPrisma } from "./prismaFunction";
import { userRouter } from "./Routes/Users";
import { cors } from "hono/cors";
import { adminRouter } from "./Routes/admin";
import { perfumeRouter } from "./Routes/perfume";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

app.use("/*", cors());
app.route("/auth", userRouter);
app.route("/auth/admin", adminRouter);
app.route("/perfume", perfumeRouter);

app.get("/", (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  return c.text("Hello Hono!");
});

export default app;
