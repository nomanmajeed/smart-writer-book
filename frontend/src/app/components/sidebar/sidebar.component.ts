import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { WriterService } from '../../services/writer.service';
import { Subscription } from 'rxjs';

interface Document {
  id: string;
  title: string;
  updatedAt: Date;
  content?: any;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  documents: Document[] = [];
  isLoading = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private writerService: WriterService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDocuments();

    // Subscribe to document updates
    this.subscriptions.push(
      this.writerService.documentUpdates$.subscribe(() => {
        this.loadDocuments();
        // Trigger change detection
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDocuments() {
    this.isLoading = true;
    this.error = null;
    
    this.writerService.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.isLoading = false;
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.error = 'Failed to load documents. Please try again.';
        this.isLoading = false;
        // Trigger change detection
        this.cdr.detectChanges();
      }
    });
  }

  async createNewDocument() {
    try {
      const content = { ops: [{ insert: '\n' }] };
      const newDoc = await this.writerService.createDocument('Untitled Document', content);
      if (newDoc) {
        this.documents.unshift(newDoc as Document);
        await this.router.navigate(['/document', (newDoc as Document).id]);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      this.error = 'Failed to create document. Please try again.';
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

  openDocument(docId: string) {
    this.router.navigate(['/document', docId]);
  }

  deleteDocument(event: Event, doc: Document) {
    // Prevent navigation when clicking delete button
    event.stopPropagation();
    event.preventDefault();

    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      this.writerService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
          // If we're currently viewing this document, navigate away
          if (this.router.url.includes(doc.id)) {
            this.router.navigate(['/']);
          }
          // Trigger change detection
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.error = 'Failed to delete document. Please try again.';
          // Trigger change detection
          this.cdr.detectChanges();
        }
      });
    }
  }
}