import { Routes } from '@angular/router';
import { LandingComponent } from './landing-page/landing-page.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { FeaturesComponent } from './features-page.component/features-page.component';
import { AboutComponent } from './about-page/about-page.component';


export const routes: Routes = [
  { path: '', component: LandingComponent },   
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'features', component: FeaturesComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' }  
];
