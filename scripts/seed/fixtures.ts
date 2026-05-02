// scripts/seed/fixtures.ts
/**
 * dev 환경 시드 데이터 정의.
 *
 * 비밀번호는 모든 계정 동일(Test1234!).
 * 시드 스크립트 시작 시점에 Supabase URL이 운영 ref이면 abort.
 */

export const TEST_PASSWORD = "Test1234!";

export const TEST_CREW = {
    name: "테스트 크루",
    description: "Dev 환경 전용 시드 크루",
    region: "서울",
    location_based_attendance: false,
    max_members: 50,
    accuracy_range: 50,
    allow_unregistered_location: true,
};

export const TEST_LOCATION = {
    name: "테스트 모임 장소",
    description: "광화문 광장",
    latitude: 37.5759,
    longitude: 126.9769,
    allowed_radius: 200,
};

export const TEST_USERS = [
    {
        email: "admin@test.com",
        first_name: "테스트관리자",
        username: "test_admin",
        crew_role: "CREW_MANAGER" as const,
        birth_year: 1990,
    },
    {
        email: "member1@test.com",
        first_name: "크루원1",
        username: "test_member1",
        crew_role: "MEMBER" as const,
        birth_year: 1995,
    },
    {
        email: "member2@test.com",
        first_name: "크루원2",
        username: "test_member2",
        crew_role: "MEMBER" as const,
        birth_year: 1998,
    },
    {
        email: "member3@test.com",
        first_name: "크루원3",
        username: "test_member3",
        crew_role: "MEMBER" as const,
        birth_year: 2000,
    },
    {
        email: "member4@test.com",
        first_name: "크루원4",
        username: "test_member4",
        crew_role: "MEMBER" as const,
        birth_year: 1992,
    },
    {
        email: "member5@test.com",
        first_name: "크루원5",
        username: "test_member5",
        crew_role: "MEMBER" as const,
        birth_year: 1988,
    },
];

export type TestUserFixture = (typeof TEST_USERS)[number];

/** 운영 프로젝트로 시드 실행 시 abort용 가드 */
export const PROD_PROJECT_REF = "sazfajslhnvzhpaianhl";
