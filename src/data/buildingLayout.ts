export interface MemberConfig {
  id: string;
  name: string;        // 역할/구성원 명칭 (Zero-PII)
  roleTitle?: string;
}

export interface RoomConfig {
  id: string;
  name: string;        // 구역/실 명칭
  floor: number;       // 1, 2, 3
  members: MemberConfig[];
}

export interface FloorConfig {
  floor: number;
  name: string;
  description: string;
  rooms: RoomConfig[];
}

export const BUILDING_STRUCTURE: FloorConfig[] = [
  {
    floor: 1,
    name: '1층 (Floor 1)',
    description: '행정실, 유치원, 교장실, 도서관, 급식실, 창조음악관',
    rooms: [
      {
        id: 'room_1f_admin',
        name: '행정실',
        floor: 1,
        members: [
          { id: 'm_adm_chief', name: '실장' },
          { id: 'm_adm_elem', name: '초등계장' },
          { id: 'm_adm_mid', name: '중등계장' },
          { id: 'm_adm_yun', name: '윤주무관' },
          { id: 'm_adm_drive', name: '운전주무관' }
        ]
      },
      {
        id: 'room_1f_kinder',
        name: '유치원',
        floor: 1,
        members: [
          { id: 'm_kin_teacher', name: '교사' },
          { id: 'm_kin_room', name: '교사실' }
        ]
      },
      {
        id: 'room_1f_principal',
        name: '교장실',
        floor: 1,
        members: [
          { id: 'm_principal', name: '교장' }
        ]
      },
      {
        id: 'room_1f_library',
        name: '도서관',
        floor: 1,
        members: [
          { id: 'm_lib_blue', name: '푸른도서관' },
          { id: 'm_lib_ssiar', name: '씨알도서관' }
        ]
      },
      {
        id: 'room_1f_cafeteria',
        name: '급식실',
        floor: 1,
        members: [
          { id: 'm_nutri', name: '영양사' },
          { id: 'm_cook', name: '조리사' },
          { id: 'm_rest', name: '휴게실' }
        ]
      },
      {
        id: 'room_1f_music',
        name: '창조음악관',
        floor: 1,
        members: [
          { id: 'm_music', name: '음악관' }
        ]
      }
    ]
  },
  {
    floor: 2,
    name: '2층 (Floor 2)',
    description: '교무실, 교실(1~6학년), 늘봄, 특별실',
    rooms: [
      {
        id: 'room_2f_staff',
        name: '교무실',
        floor: 2,
        members: [
          { id: 'm_sub_principal', name: '교감' },
          { id: 'm_head_teacher', name: '교무' },
          { id: 'm_admin_assistant', name: '행정사' },
          { id: 'm_english_teacher', name: '영어' },
          { id: 'm_common_staff', name: '공용' }
        ]
      },
      {
        id: 'room_2f_classrooms',
        name: '교실',
        floor: 2,
        members: [
          { id: 'm_c1', name: '1학년' },
          { id: 'm_c2', name: '2학년' },
          { id: 'm_c3', name: '3학년' },
          { id: 'm_c4', name: '4학년' },
          { id: 'm_c5', name: '5학년' },
          { id: 'm_c6', name: '6학년' }
        ]
      },
      {
        id: 'room_2f_neulbom',
        name: '늘봄',
        floor: 2,
        members: [
          { id: 'm_neul_head', name: '늘봄실장' },
          { id: 'm_neul_coord', name: '늘봄코디' },
          { id: 'm_neul_room', name: '늘봄교실' }
        ]
      },
      {
        id: 'room_2f_special',
        name: '특별실',
        floor: 2,
        members: [
          { id: 'm_eng_lab', name: '영어실' },
          { id: 'm_comp_lab', name: '컴퓨터실' },
          { id: 'm_info_lab', name: '정보실' }
        ]
      }
    ]
  },
  {
    floor: 3,
    name: '3층 (Floor 3)',
    description: '과학실, 우리친구반, 보건실',
    rooms: [
      {
        id: 'room_3f_science',
        name: '과학실',
        floor: 3,
        members: [
          { id: 'm_sci_lab', name: '과학실' }
        ]
      },
      {
        id: 'room_3f_friend',
        name: '우리친구반',
        floor: 3,
        members: [
          { id: 'm_friend', name: '우리친구반' }
        ]
      },
      {
        id: 'room_3f_health',
        name: '보건실',
        floor: 3,
        members: [
          { id: 'm_health', name: '보건실' }
        ]
      }
    ]
  }
];
