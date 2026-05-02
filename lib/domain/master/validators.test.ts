import { describe, it, expect } from 'vitest';
import { 크루생성입력_검증, 크루수정입력_검증 } from './validators';

describe('master 검증', () => {
    describe('크루생성입력_검증', () => {
        it('정상 입력 → ok=true', () => {
            const result = 크루생성입력_검증({
                name: '한강 러닝',
                description: '함께 달려요',
                region: '서울',
                generate_first_admin_code: true,
            });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.name).toBe('한강 러닝');
                expect(result.data.description).toBe('함께 달려요');
                expect(result.data.region).toBe('서울');
                expect(result.data.generate_first_admin_code).toBe(true);
            }
        });

        it('이름 trim 적용', () => {
            const result = 크루생성입력_검증({ name: '  한강 러닝  ' });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.name).toBe('한강 러닝');
            }
        });

        it('빈 description은 null로 정규화', () => {
            const result = 크루생성입력_검증({ name: '한강', description: '   ' });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.description).toBeNull();
            }
        });

        it('이름 누락 → ok=false (name 필드)', () => {
            const result = 크루생성입력_검증({ name: '' });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('name');
            }
        });

        it('이름 공백만 → ok=false', () => {
            const result = 크루생성입력_검증({ name: '   ' });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('name');
            }
        });

        it('description 1001자 → ok=false (description 필드)', () => {
            const result = 크루생성입력_검증({
                name: '한강',
                description: '가'.repeat(1001),
            });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('description');
            }
        });

        it('region 51자 초과 → ok=false', () => {
            const result = 크루생성입력_검증({
                name: '한강',
                region: '가'.repeat(51),
            });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('region');
            }
        });

        it('잘못된 입력 타입(null) → ok=false', () => {
            const result = 크루생성입력_검증(null);
            expect(result.ok).toBe(false);
        });
    });

    describe('크루수정입력_검증', () => {
        it('빈 객체 → ok=true (no-op 업데이트)', () => {
            const result = 크루수정입력_검증({});
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data).toEqual({});
            }
        });

        it('이름만 변경', () => {
            const result = 크루수정입력_검증({ name: '새이름' });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.name).toBe('새이름');
                expect(result.data.region).toBeUndefined();
            }
        });

        it('이름 빈 문자열 → ok=false', () => {
            const result = 크루수정입력_검증({ name: '' });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('name');
            }
        });

        it('description null → 명시적 null 반영', () => {
            const result = 크루수정입력_검증({ description: null });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.description).toBeNull();
            }
        });

        it('accuracy_range 100 → ok=true', () => {
            const result = 크루수정입력_검증({ accuracy_range: 100 });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.accuracy_range).toBe(100);
            }
        });

        it('accuracy_range null → 명시적 null', () => {
            const result = 크루수정입력_검증({ accuracy_range: null });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.accuracy_range).toBeNull();
            }
        });

        it('accuracy_range 5001 → ok=false', () => {
            const result = 크루수정입력_검증({ accuracy_range: 5001 });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('accuracy_range');
            }
        });

        it('location_based_attendance / allow_unregistered_location 반영', () => {
            const result = 크루수정입력_검증({
                location_based_attendance: true,
                allow_unregistered_location: false,
            });
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.data.location_based_attendance).toBe(true);
                expect(result.data.allow_unregistered_location).toBe(false);
            }
        });

        it('region 51자 초과 → ok=false', () => {
            const result = 크루수정입력_검증({ region: '가'.repeat(51) });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.field).toBe('region');
            }
        });

        it('잘못된 입력 타입(null) → ok=false', () => {
            const result = 크루수정입력_검증(null);
            expect(result.ok).toBe(false);
        });
    });
});
