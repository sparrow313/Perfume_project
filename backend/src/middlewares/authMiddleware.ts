import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
const adminRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    SECRET: string;
  };
}>();
export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const header = c.req.header("authorization") || "";
  const user = await verify(header, c.env.SECRET);

  try {
    if (user) {
      c.set("adminID", user.id);
      await next();
    } else {
      c.status(401);
      c.json({
        message: "You are not loggedIn",
      });
    }
  } catch (error) {
    c.status(401);
    c.json({
      message: "You are not loggedIn",
    });
  }
});
