import { FirebaseApp } from 'firebase/app';
import { Backend } from '@firebase/ai';

export interface AI {
  app: FirebaseApp;
  backend: Backend;
  location: string;
}
