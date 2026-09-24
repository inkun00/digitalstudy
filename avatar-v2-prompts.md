# 피해 친구 아바타 생성 프롬프트

도구: Codex 내장 `image_gen`. 한 인물당 한 번씩 별도 생성. 도구 응답에는 모델 식별자가 노출되지 않아 개별 결과의 정확한 모델 버전은 확인할 수 없다.

공통 프롬프트: "Create ONE brand-new square avatar illustration for a Korean elementary school counseling chatbot. Head and shoulders, straight-on, eyes toward viewer, face large and precisely centered so it remains legible in a 46px circular avatar. Polished contemporary Korean children's-book illustration, gentle hand-painted lines, soft pastel color, warm natural light, softly blurred school setting. Respectful, age-appropriate, clearly a fictional child. No phone, no text, no logos, no other people, no watermark. Simple clean background."

각 인물의 추가 프롬프트:

| 이름 | 외형과 표정 |
| --- | --- |
| 민지 | 11세 여자아이, 짧은 검은 단발과 분홍 머리핀, 민트색 카디건. 단톡방 조롱으로 걱정스럽고 슬픈 표정. |
| 준우 | 12세 남자아이, 헝클어진 짙은 갈색 짧은 머리와 남색 후드. 게임 아이템 갈취 협박으로 조심스럽고 불안한 눈빛. |
| 서연 | 11세 여자아이, 낮게 묶은 긴 검은 머리와 연보라색 옷. 온라인 사진 피해로 속상하고 경계하는 표정. |
| 도윤 | 12세 남자아이, 단정한 검은 머리와 둥근 안경, 연녹색 옷. 계정 사칭 피해로 당황하고 상처받았지만 침착한 표정. |
| 하은 | 11세 여자아이, 어깨 길이의 검은 머리와 겨자색 카디건. 허위 소문으로 억울하지만 용기를 내는 표정. |
| 지호 | 10세 남자아이, 짧은 검은 머리와 하늘색 점퍼. 온라인 괴롭힘으로 조심스럽고 걱정스러운 표정. |
| 예은 | 10세 여자아이, 양쪽 낮은 땋은 머리와 코랄색 옷. 악성 댓글로 자신감이 떨어진 조용한 슬픔. |
| 시우 | 10세 남자아이, 짧고 살짝 웨이브진 검은 머리와 주황색 스웨터. 불안하지만 희망이 남아 있는 눈빛. |
| 수아 | 12세 여자아이, 반묶음 검은 머리와 연파란 카디건. 차분하면서도 생각에 잠긴 걱정스러운 표정. |
| 현우 | 11세 남자아이, 짧은 검은 머리와 올리브색 후드. 단톡방 모욕으로 속상하지만 회복력을 가진 표정. |

수아는 사건을 직접 묘사한 초기 프롬프트가 생성 서비스의 입력 안전 검사에서 거절되어, 최종 생성에서는 사건 묘사를 제외하고 인물의 감정과 구도만 지정했다.
