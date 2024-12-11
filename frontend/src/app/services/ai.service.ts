import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AISuggestion {
  type: 'grammar' | 'content' | 'word-analysis';
  suggestion: string;
  context?: string;
  examples?: string[];
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {
    console.log('AI Service initialized with API URL:', this.apiUrl);
  }

  getContentSuggestions(text: string): Observable<AISuggestion[]> {
    const url = `${this.apiUrl}/ai/suggestions/`;
    console.log('Making POST request to:', url);
    return this.http.post<AISuggestion[]>(url, { text }).pipe(
      tap(response => console.log('Content suggestions response:', response)),
      catchError(error => {
        console.error('Error getting content suggestions:', error);
        throw error;
      })
    );
  }

  getWordAnalysis(word: string): Observable<AISuggestion[]> {
    const url = `${this.apiUrl}/ai/word-analysis/${word}/`;
    console.log('Making GET request to:', url);
    return this.http.get<AISuggestion[]>(url).pipe(
      tap(response => console.log('Word analysis response:', response)),
      catchError(error => {
        console.error('Error getting word analysis:', error);
        throw error;
      })
    );
  }

  getGrammarCheck(text: string): Observable<AISuggestion[]> {
    const url = `${this.apiUrl}/ai/grammar/`;
    console.log('Making POST request to:', url);
    return this.http.post<AISuggestion[]>(url, { text }).pipe(
      tap(response => console.log('Grammar check response:', response)),
      catchError(error => {
        console.error('Error checking grammar:', error);
        throw error;
      })
    );
  }
}
