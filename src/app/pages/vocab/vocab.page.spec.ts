import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VocabPage } from './vocab.page';

describe('VocabPage', () => {
  let component: VocabPage;
  let fixture: ComponentFixture<VocabPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VocabPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
