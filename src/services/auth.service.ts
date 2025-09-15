import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
         UserCredential, updateProfile, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore // Optional: for storing user data
  ) {}

  async signup(email: string, password: string, additionalData?: any): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Optional: Update user profile
      if (additionalData?.firstName && additionalData?.lastName) {
        await updateProfile(userCredential.user, {
          displayName: `${additionalData.firstName} ${additionalData.lastName}`
        });
      }

      // Optional: Save additional user data to Firestore
      if (additionalData) {
        await this.saveUserData(userCredential.user.uid, additionalData);
      }

      return userCredential;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return this.auth.signOut();
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  // Observable for auth state changes
  get authState(): Observable<User | null> {
    return new Observable(observer => {
      return this.auth.onAuthStateChanged(observer);
    });
  }

  // Optional: Save additional user data to Firestore
  private async saveUserData(uid: string, data: any): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    const userData = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      monthlyIncome: data.monthlyIncome,
      financialGoals: data.financialGoals,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(userRef, userData);
  }

  private handleError(error: any): Error {
    let message = 'An error occurred during authentication';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Try logging in instead.';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address format.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        break;
      default:
        message = error.message;
    }
    
    return new Error(message);
  }
}

