import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FinancialDataService } from '../../services/financial-data.service';
import { Goal } from '../../models/financial.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goal-page',
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class GoalPageComponent implements OnInit {

  goals$: Observable<Goal[]>;
  addGoalForm: FormGroup;
  editingGoal: Goal | null = null;
  isLoading = false;
  goalSaved = false;

  categories = ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Housing', 'Insurance', 'Other'];
  priorities = ['low', 'medium', 'high'];
  showGoalModal = false;
  

  constructor(
    private financialService: FinancialDataService,
    private fb: FormBuilder
  ) {
    this.goals$ = this.financialService.goals$;

    this.addGoalForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      target: [0, [Validators.required, Validators.min(1)]],
      current: [0],
      deadline: ['', Validators.required],
      color: ['#4F46E5', Validators.required],
      category: ['other', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit(): void {}

 async submitGoal() {
  if (this.addGoalForm.invalid) {
    this.addGoalForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  this.goalSaved = false;

  const goalData = this.addGoalForm.value;
  console.log('Submitting goal:', goalData); 

  try {
    if (this.editingGoal) {
      console.log('Updating existing goal:', this.editingGoal.id); 
      await this.financialService.updateGoal(this.editingGoal.id!, {
        ...goalData,
        deadline: new Date(goalData.deadline)
      });
      console.log('Goal updated successfully'); 
      this.editingGoal = null;
    } else {
      console.log('Adding new goal for user...');
      const newGoalId = await this.financialService.addGoal({
        ...goalData,
        current: 0,
        deadline: new Date(goalData.deadline)
      });
      console.log('Goal added successfully with ID:', newGoalId); 
    }
    
    // Show success feedback
    this.goalSaved = true;
    
    // Reset form with default values
    this.addGoalForm.reset({ 
      current: 0, 
      color: '#4F46E5', 
      category: 'other', 
      priority: 'medium' 
    });
    
    // Hide success message and close modal after 2 seconds
    setTimeout(() => {
      this.goalSaved = false;
      this.closeGoalModal();
    }, 2000);

  } catch (error) {
    console.error('Error saving goal:', error);
    // You might want to show an error message to the user here
    // this.showErrorMessage('Failed to save goal. Please try again.');
  } finally {
    this.isLoading = false;
  }
}

 

  openGoalModal(): void {
    this.showGoalModal = true;
    this.editingGoal = null; 
    this.addGoalForm.reset(); 
  }
  
  closeGoalModal(): void {
    this.showGoalModal = false;
    this.editingGoal = null;
    this.addGoalForm.reset();
  }
  
  editGoal(goal: any): void {
    this.editingGoal = goal;
    this.showGoalModal = true;
   
    this.addGoalForm.patchValue({
      title: goal.title,
      description: goal.description,
      target: goal.target,
      deadline: goal.deadline,
      color: goal.color,
      category: goal.category,
      priority: goal.priority
    });
  }

  async completeGoal(goal: Goal) {
    if (!goal.id) return;
    try {
      await this.financialService.updateGoal(goal.id, { isCompleted: true });
    } catch (error) {
      console.error('Error completing goal:', error);
    }
  }

  progressPercentage(goal: Goal): number {
    return Math.min(100, (goal.current / goal.target) * 100);
  }

 
isDeadlineUrgent(deadline: Date): boolean {
  const days = this.getDaysUntilDeadline(deadline);
  return days <= 7;
}

isDeadlineSoon(deadline: Date): boolean {
  const days = this.getDaysUntilDeadline(deadline);
  return days > 7 && days <= 30;
}

getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

addFundsToGoal(goal: any): void {
 
}

scrollToForm(): void {

}
}
