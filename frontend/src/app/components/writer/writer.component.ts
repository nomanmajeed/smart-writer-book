import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import type Quill from 'quill';
import { quillConfig } from './quill.config';

@Component({
  selector: 'app-writer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './writer.component.html',
  styleUrls: ['./writer.component.css']
})
export class WriterComponent implements OnInit {
  @ViewChild('editor') private editorElement!: ElementRef;
  private editor!: Quill;
  isLoading = false;
  suggestions: string[] = [];

  ngOnInit(): void {
    // Initialize Quill only in browser environment
    if (typeof window !== 'undefined') {
      this.initializeQuill();
    }
  }

  private async initializeQuill(): Promise<void> {
    try {
      const Quill = (await import('quill')).default;
      this.editor = new Quill(this.editorElement.nativeElement, quillConfig);
    } catch (error) {
      console.error('Error initializing Quill:', error);
    }
  }

  clearEditor(): void {
    if (this.editor) {
      this.editor.setText('');
      this.suggestions = [];
    }
  }

  getSuggestions(): void {
    if (!this.editor) return;

    this.isLoading = true;
    const content = this.editor.getText();
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      // Mock suggestions - replace with actual API call
      this.suggestions = [
        'Consider adding more descriptive details to the scene',
        'Try incorporating dialogue to make the story more engaging',
        'You could expand on the character\'s emotions here'
      ];
      this.isLoading = false;
    }, 1500);
  }
}
