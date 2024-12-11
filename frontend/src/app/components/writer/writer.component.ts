import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import type Quill from 'quill';
import { quillConfig } from './quill.config';
import { AIService, AISuggestion } from '../../services/ai.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-writer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './writer.component.html',
  styleUrls: ['./writer.component.css']
})
export class WriterComponent implements OnInit {
  @ViewChild('editor') private editorElement!: ElementRef;
  private editor!: Quill;
  private textChangeSubject = new Subject<string>();
  
  isLoading = false;
  suggestions: AISuggestion[] = [];
  selectedWord: string = '';
  wordAnalysis: AISuggestion[] = [];
  cursorPosition = { top: 0, left: 0 };

  constructor(private aiService: AIService) {
    // Set up debounced text change handler
    this.textChangeSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(text => {
      if (text.length > 10) {
        this.checkGrammar(text);
      }
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.initializeQuill();
    }
  }

  private async initializeQuill(): Promise<void> {
    try {
      const Quill = (await import('quill')).default;
      this.editor = new Quill(this.editorElement.nativeElement, quillConfig);
      
      // Set up text change handler
      this.editor.on('text-change', () => {
        const text = this.editor.getText();
        this.textChangeSubject.next(text);
        this.updateCursorPosition();
      });

      // Set up selection change handler
      this.editor.on('selection-change', (range) => {
        if (range) {
          this.updateCursorPosition();
          if (range.length > 0) {
            const text = this.editor.getText(range.index, range.length);
            if (text.trim().split(/\s+/).length === 1) {
              this.selectedWord = text.trim();
              this.getWordAnalysis(this.selectedWord);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing Quill:', error);
    }
  }

  private updateCursorPosition(): void {
    const selection = this.editor.getSelection();
    if (selection) {
      const bounds = this.editor.getBounds(selection.index);
      if (bounds) {
        const editorBounds = this.editorElement.nativeElement.getBoundingClientRect();
        
        // Position suggestions to the right of the cursor
        this.cursorPosition = {
          top: bounds.top + editorBounds.top - 10, // Slight offset up
          left: bounds.left + editorBounds.left + bounds.width + 10 // Position to right with offset
        };
      }
    }
  }

  clearEditor(): void {
    if (this.editor) {
      this.editor.setText('');
      this.suggestions = [];
      this.wordAnalysis = [];
    }
  }

  getSuggestions(): void {
    if (!this.editor) return;

    this.isLoading = true;
    const content = this.editor.getText();
    
    this.aiService.getContentSuggestions(content).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting suggestions:', error);
        this.isLoading = false;
      }
    });
  }

  private checkGrammar(text: string): void {
    this.isLoading = true;
    this.aiService.getGrammarCheck(text).subscribe({
      next: (grammarSuggestions) => {
        this.suggestions = grammarSuggestions;
        this.isLoading = false;
        this.updateCursorPosition(); // Update position when new suggestions arrive
      },
      error: (error) => {
        console.error('Error checking grammar:', error);
        this.isLoading = false;
      }
    });
  }

  private getWordAnalysis(word: string): void {
    this.aiService.getWordAnalysis(word).subscribe({
      next: (analysis) => {
        this.wordAnalysis = analysis;
      },
      error: (error) => console.error('Error getting word analysis:', error)
    });
  }

  applySuggestion(suggestion: AISuggestion): void {
    const selection = this.editor.getSelection();
    if (!selection) return;

    let text = this.editor.getText();
    let currentLineStart = text.lastIndexOf('\n', selection.index - 1) + 1;
    if (currentLineStart === 0) currentLineStart = 0;
    let currentLineEnd = text.indexOf('\n', selection.index);
    if (currentLineEnd === -1) currentLineEnd = text.length;

    // Get the current line text
    const currentLine = text.substring(currentLineStart, currentLineEnd);

    // Apply the suggestion based on type
    switch (suggestion.type.toLowerCase()) {
      case 'grammar':
        // For grammar suggestions, replace the entire line
        this.editor.deleteText(currentLineStart, currentLine.length);
        this.editor.insertText(currentLineStart, currentLine + '.');
        break;
      
      case 'style':
        // For style suggestions (like js -> JavaScript), replace the specific word
        const jsIndex = currentLine.toLowerCase().indexOf('js');
        if (jsIndex !== -1) {
          const absoluteIndex = currentLineStart + jsIndex;
          this.editor.deleteText(absoluteIndex, 2);
          this.editor.insertText(absoluteIndex, 'JavaScript');
        }
        break;

      case 'feedback':
        // For feedback, just clear suggestions as it's informational
        break;
    }

    // Clear suggestions after applying
    this.suggestions = [];
  }

  getSuggestionIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'grammar':
        return 'spellcheck';
      case 'style':
        return 'format_paint';
      case 'feedback':
        return 'thumb_up';
      default:
        return 'lightbulb';
    }
  }

  getSuggestionColor(type: string): string {
    switch (type) {
      case 'grammar':
        return 'warn';
      case 'content':
        return 'primary';
      case 'word-analysis':
        return 'accent';
      default:
        return '';
    }
  }
}
