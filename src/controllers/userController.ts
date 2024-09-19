import { Request, Response } from "express";

// Mock data (for now, but you can connect this to a database later)
const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
];

// GET /api/users
export const getUsers = (req: Request, res: Response) => {
  res.json(users);
};

// GET /api/users/:id
export const getUserById = (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};
