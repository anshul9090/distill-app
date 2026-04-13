import { TestBed } from '@angular/core/testing';

import { Summary } from './summary';

describe('Summary', () => {
  let service: Summary;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Summary);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
