import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Quill from 'quill';
import { WriterService } from '../../services/writer.service';

@Component({
  selector: 'app-writer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="writer-container">
      <mat-card-header>
        <mat-card-title>Smart Writer</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div #editor class="editor-container"></div>
        <div class="suggestions-panel" *ngIf="suggestions">
          <h3>AI Suggestions</h3>
          <p>{{ suggestions }}</p>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="getAISuggestions()" [disabled]="isLoading">
          Get AI Suggestions
          <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .writer-container {
      margin: 20px;
      max-width: 1200px;
      margin: 20px auto;
    }
    .editor-container {
      height: 400px;
      margin-bottom: 20px;
    }
    .suggestions-panel {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
    }
    button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class WriterComponent implements OnInit {
  @ViewChild('editor') editorElement!: ElementRef;
  
  private editor!: Quill;
  suggestions: string = '';
  isLoading: boolean = false;

  constructor(private writerService: WriterService) {}

  ngOnInit() {
    this.initializeQuill();
  }

  private initializeQuill() {
    this.editor = new Quill(this.editorElement.nativeElement, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['clean']
        ]
      }
    });
  }

  async getAISuggestions() {
    const content = this.editor.getText();
    if (!content.trim()) return;

    this.isLoading = true;
    try {
      const response = await this.writerService.getAISuggestions(content);
      this.suggestions = response.suggestion;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // TODO: Add error handling UI
    } finally {
      this.isLoading = false;
    }
  }
}
