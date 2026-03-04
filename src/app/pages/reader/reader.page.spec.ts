import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReaderPage } from './reader.page';

describe('ReaderPage', () => {
  let component: ReaderPage;
  let fixture: ComponentFixture<ReaderPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReaderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
