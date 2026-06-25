import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { environment } from '../../../../src/environments/environment';

interface TestEntity {
  _id?: number;
  nombre: string;
  estado: number;
}

@Injectable()
class TestCrudService extends BaseCrudService<TestEntity> {
  override readonly endpoint = 'test-items';
}

describe('BaseCrudService', () => {
  let service: TestCrudService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestCrudService,
      ],
    });
    service = TestBed.inject(TestCrudService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('should GET items with page and limit params', () => {
      service.getAll(1, 20).subscribe();
      const req = httpController.expectOne('/api/test-items?page=1&limit=20');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], meta: { total: 0 } });
    });

    it('should add search param when provided', () => {
      service.getAll(1, 10, 'laptop').subscribe();
      const req = httpController.expectOne(
        '/api/test-items?page=1&limit=10&search=laptop',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], meta: { total: 0 } });
    });

    it('should encode URI components in search', () => {
      service.getAll(1, 10, 'cañón').subscribe();
      httpController.expectOne(
        '/api/test-items?page=1&limit=10&search=ca%C3%B1%C3%B3n',
      );
    });

    it('should return data and total from ApiResponse', () => {
      const mockResponse = {
        data: [
          { _id: 1, nombre: 'Item 1', estado: 1 },
          { _id: 2, nombre: 'Item 2', estado: 1 },
        ],
        meta: { total: 50 },
      };

      let result: any;
      service.getAll(1, 20).subscribe((r) => (result = r));
      httpController.expectOne('/api/test-items?page=1&limit=20').flush(mockResponse);

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(50);
    });

    it('should fallback to data length when meta.total is missing', () => {
      const mockResponse = {
        data: [{ _id: 1, nombre: 'Item 1', estado: 1 }],
      };

      let result: any;
      service.getAll(1, 20).subscribe((r) => (result = r));
      httpController.expectOne('/api/test-items?page=1&limit=20').flush(mockResponse);

      expect(result.total).toBe(1);
    });
  });

  describe('getAllList()', () => {
    it('should GET items without pagination', () => {
      service.getAllList().subscribe();
      const req = httpController.expectOne('/api/test-items');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('should return data array', () => {
      let result: any;
      service.getAllList().subscribe((r) => (result = r));
      httpController.expectOne('/api/test-items').flush({
        data: [{ _id: 1, nombre: 'Test', estado: 1 }],
      });
      expect(result.length).toBe(1);
    });
  });

  describe('getById()', () => {
    it('should GET a single item by numeric id', () => {
      service.getById(5).subscribe();
      const req = httpController.expectOne('/api/test-items/5');
      expect(req.request.method).toBe('GET');
      req.flush({ data: { _id: 5, nombre: 'Item', estado: 1 } });
    });

    it('should GET a single item by string id', () => {
      service.getById('abc-123').subscribe();
      httpController.expectOne('/api/test-items/abc-123').flush({ data: {} });
    });
  });

  describe('create()', () => {
    it('should POST data and return created item', () => {
      const newItem = { nombre: 'Nuevo', estado: 1 };
      let result: any;
      service.create(newItem).subscribe((r) => (result = r));
      const req = httpController.expectOne('/api/test-items');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newItem);
      req.flush({ data: { _id: 10, ...newItem } });
      expect(result._id).toBe(10);
    });
  });

  describe('update()', () => {
    it('should PUT data and return updated item', () => {
      const updates = { nombre: 'Actualizado' };
      let result: any;
      service.update(5, updates).subscribe((r) => (result = r));
      const req = httpController.expectOne('/api/test-items/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ data: { _id: 5, nombre: 'Actualizado', estado: 1 } });
      expect(result.nombre).toBe('Actualizado');
    });
  });

  describe('delete()', () => {
    it('should DELETE and return void', () => {
      let emitted = false;
      service.delete(5).subscribe(() => (emitted = true));
      const req = httpController.expectOne('/api/test-items/5');
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: null });
      expect(emitted).toBe(true);
    });
  });
});
