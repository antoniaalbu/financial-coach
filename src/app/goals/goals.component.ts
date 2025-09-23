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

  categories = ['emergency', 'vacation', 'house', 'car', 'investment', 'other'];
  priorities = ['low', 'medium', 'high'];

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
    if (this.addGoalForm.invalid) return;

    const goalData = this.addGoalForm.value;
    console.log('Submitting goal:', goalData); // 🔹 log form data

    try {
      if (this.editingGoal) {
        console.log('Updating existing goal:', this.editingGoal.id); // 🔹 log editing goal ID
        await this.financialService.updateGoal(this.editingGoal.id!, {
          ...goalData,
          deadline: new Date(goalData.deadline)
        });
        console.log('Goal updated successfully'); // 🔹 log success
        this.editingGoal = null;
      } else {
        console.log('Adding new goal for user...');
        const newGoalId = await this.financialService.addGoal({
          ...goalData,
          current: 0,
          deadline: new Date(goalData.deadline)
        });
        console.log('Goal added successfully with ID:', newGoalId); // 🔹 log new goal ID
      }
      this.addGoalForm.reset({ current: 0, color: '#4F46E5', category: 'other', priority: 'medium' });
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  }

  editGoal(goal: Goal) {
    this.editingGoal = goal;
    this.addGoalForm.setValue({
      title: goal.title,
      description: goal.description || '',
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline.toISOString().substring(0, 10),
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
}
