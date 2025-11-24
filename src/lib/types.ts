import { FieldValue } from "firebase/firestore";

export type Message = {
  id: string;
  author: string;
  content: string;
  timestamp: FieldValue | string;
};
