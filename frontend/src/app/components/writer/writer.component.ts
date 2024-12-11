import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import type Quill from 'quill';
import { quillConfig } from './quill.config';
import { AIService, AISuggestion } from '../../services/ai.service';
import { WriterService } from '../../services/writer.service';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-writer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './writer.component.html',
  styleUrls: ['./writer.component.scss']
})
export class WriterComponent implements OnInit, OnDestroy {
  @ViewChild('editor') private editorElement!: ElementRef;
  private editor!: Quill;
  private textChangeSubject = new Subject<string>();
  private saveSubject = new Subject<void>();
  private subscriptions: Subscription[] = [];
  
  isLoading = false;
  isSaving = false;
  documentId: string = '';
  documentTitle: string = 'Untitled Document';
  suggestions: AISuggestion[] = [];
  selectedWord: string = '';
  wordAnalysis: AISuggestion[] = [];
  cursorPosition = { top: 0, left: 0 };

  constructor(
    private aiService: AIService,
    private writerService: WriterService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriptions.push(
      this.textChangeSubject.pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe(text => {
        if (text.length > 10) {
          this.checkGrammar(text);
        }
      })
    );

    this.subscriptions.push(
      this.saveSubject.pipe(
        debounceTime(2000)
      ).subscribe(() => {
        this.saveDocument();
      })
    );
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.initializeQuill();
      this.subscriptions.push(
        this.route.params.subscribe(params => {
          this.documentId = params['id'];
          if (this.documentId && this.documentId !== 'new') {
            this.loadDocument();
          }
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.textChangeSubject.complete();
    this.saveSubject.complete();
  }

  onTitleChange(): void {
    this.saveSubject.next();
  }

  private async initializeQuill(): Promise<void> {
    try {
      const Quill = (await import('quill')).default;
      this.editor = new Quill(this.editorElement.nativeElement, quillConfig);
      
      this.editor.on('text-change', () => {
        const text = this.editor.getText();
        this.textChangeSubject.next(text);
        this.updateCursorPosition();
        this.saveSubject.next();
      });

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
      this.showError('Error initializing editor');
    }
  }

  private async loadDocument(): Promise<void> {
    try {
      const document = await this.writerService.getDocument(this.documentId).toPromise();
      if (document) {
        this.documentTitle = document.title;
        if (document.content && this.editor) {
          this.editor.setContents(document.content);
        }
      }
    } catch (error) {
      console.error('Error loading document:', error);
      this.showError('Error loading document');
    }
  }

  public async saveDocument(): Promise<void> {
    if (!this.editor || this.isSaving) return;

    this.isSaving = true;
    try {
      const content = this.editor.getContents();
      const data = {
        title: this.documentTitle,
        content: content
      };

      if (this.documentId === 'new') {
        const newDoc = await this.writerService.createDocument(this.documentTitle, JSON.stringify(content) as any);
        this.documentId = (newDoc as any).id;
        await this.router.navigate(['/document', this.documentId], { replaceUrl: true });
      } else {
        await this.writerService.updateDocument(this.documentId, data).toPromise();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      this.showError('Error saving document');
    } finally {
      this.isSaving = false;
    }
  }

  private updateCursorPosition(): void {
    const selection = this.editor.getSelection();
    if (selection) {
      const bounds = this.editor.getBounds(selection.index);
      if (bounds) {
        const editorBounds = this.editorElement.nativeElement.getBoundingClientRect();
        
        // Position suggestions closer to the text
        this.cursorPosition = {
          top: editorBounds.top, // Position below the line
          left: editorBounds.left // Align with the start of selection
        };
      }
    }
  }

  clearEditor(): void {
    if (this.editor) {
      this.editor.setText('');
      this.suggestions = [];
      this.wordAnalysis = [];
      this.documentTitle = 'Untitled Document';
      this.router.navigate(['/document/new']);
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
        this.showError('Error getting AI suggestions');
      }
    });
  }

  private checkGrammar(text: string): void {
    this.isLoading = true;
    this.aiService.getGrammarCheck(text).subscribe({
      next: (grammarSuggestions) => {
        this.suggestions = grammarSuggestions;
        this.isLoading = false;
        this.updateCursorPosition();
      },
      error: (error) => {
        console.error('Error checking grammar:', error);
        this.isLoading = false;
        this.showError('Error checking grammar');
      }
    });
  }

  private getWordAnalysis(word: string): void {
    this.aiService.getWordAnalysis(word).subscribe({
      next: (analysis) => {
        this.wordAnalysis = analysis;
      },
      error: (error) => {
        console.error('Error getting word analysis:', error);
        this.showError('Error analyzing word');
      }
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

    const currentLine = text.substring(currentLineStart, currentLineEnd);

    switch (suggestion.type.toLowerCase()) {
      case 'grammar':
        this.editor.deleteText(currentLineStart, currentLine.length);
        this.editor.insertText(currentLineStart, currentLine + '.');
        break;
      
      case 'style':
        const jsIndex = currentLine.toLowerCase().indexOf('js');
        if (jsIndex !== -1) {
          const absoluteIndex = currentLineStart + jsIndex;
          this.editor.deleteText(absoluteIndex, 2);
          this.editor.insertText(absoluteIndex, 'JavaScript');
        }
        break;

      case 'feedback':
        break;
    }

    this.suggestions = [];
  }

  closeSuggestions(): void {
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
    switch (type.toLowerCase()) {
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

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}