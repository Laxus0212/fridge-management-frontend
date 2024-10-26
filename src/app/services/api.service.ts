// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import {RoutePaths} from "../enums/route-paths";
// import {environment} from "../../environments/environment";
//
// @Injectable({
//   providedIn: 'root'
// })
// export class ApiService {
//   private baseUrl = environment.BASE_URL;
//
//   constructor(private http: HttpClient) {}
//
//   register(data: any): Observable<any> {
//     return this.http.post(`${this.baseUrl}/${RoutePaths.Users}/${RoutePaths.Register}`, data);
//   }
//
//   login(data: any): Observable<any> {
//     return this.http.post(`${this.baseUrl}/${RoutePaths.Users}/${RoutePaths.Login}`, data);
//   }
//
//   getFridges(): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${RoutePaths.Fridges}`);
//   }
//
//   addFridge(data: any): Observable<any> {
//     return this.http.post(`${this.baseUrl}/${RoutePaths.Fridges}`, data);
//   }
//
//   updateFridge(id: number, data: any): Observable<any> {
//     return this.http.put(`${this.baseUrl}/${RoutePaths.Fridges}/${id}`, data);
//   }
//
//   deleteFridge(id: number): Observable<any> {
//     return this.http.delete(`${this.baseUrl}/${RoutePaths.Fridges}/${id}`);
//   }
//
//   getShoppingList(familyId: number): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${RoutePaths.ShoppingList}/${familyId}`);
//   }
//
//   addProductToShoppingList(data: any): Observable<any> {
//     return this.http.post(`${this.baseUrl}/${RoutePaths.ShoppingList}`, data);
//   }
//
//   updateShoppingListItem(id: number, data: any): Observable<any> {
//     return this.http.put(`${this.baseUrl}/${RoutePaths.ShoppingList}/${id}`, data);
//   }
//
//   deleteShoppingListItem(id: number): Observable<any> {
//     return this.http.delete(`${this.baseUrl}/${RoutePaths.ShoppingList}/${id}`);
//   }
// }
