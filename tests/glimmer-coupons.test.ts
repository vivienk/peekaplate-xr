import {describe,it,expect} from 'vitest';
import {finds,restaurantCoupons} from '../src/glimmer/data';
describe('restaurant coupon reminder',()=>{
 it('shows only collected coupons for the matching restaurant',()=>{
  const coupon=finds.find(f=>f.coupon)!;
  expect(restaurantCoupons([],coupon.couponRestaurantId!)).toEqual([]);
  expect(restaurantCoupons([coupon.id],coupon.couponRestaurantId!)).toEqual([coupon]);
  expect(restaurantCoupons([coupon.id],'another-restaurant')).toEqual([]);
 });
 it('preserves collection identity after save serialization',()=>{
  const coupon=finds.find(f=>f.coupon)!;
  const saved=JSON.parse(JSON.stringify({finds:[coupon.id]}));
  expect(restaurantCoupons(saved.finds,coupon.couponRestaurantId!)).toHaveLength(1);
 });
});
