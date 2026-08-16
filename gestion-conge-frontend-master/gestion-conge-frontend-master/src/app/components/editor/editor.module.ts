import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorRoutingModule } from './editor-routing.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { EditorComponent } from './editor.component';

@NgModule({
  declarations: [EditorComponent],
  imports: [
    CommonModule,
    EditorRoutingModule,
    CKEditorModule,
    AngularEditorModule,
    FormsModule
  ]
})
export class EditorModule { }
