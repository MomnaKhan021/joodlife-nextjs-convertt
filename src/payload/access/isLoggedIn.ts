import type { Access } from "payload";

export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user);

export const isPublic: Access = () => true;
