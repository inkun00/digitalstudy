import { GENDER_LABELS } from "@/lib/userProfile";

export default function ProfileFields({ prefix, profile, onChange }) {
  return <>
    <label htmlFor={`${prefix}-name`}>이름</label>
    <input id={`${prefix}-name`} name="name" type="text" autoComplete="name" maxLength={20} value={profile.name} onChange={(event) => onChange({ ...profile, name: event.target.value })} placeholder="이름을 입력해 주세요" required />

    <div className="start-form-grid">
      <div><label htmlFor={`${prefix}-gender`}>성별</label><select id={`${prefix}-gender`} name="gender" value={profile.gender} onChange={(event) => onChange({ ...profile, gender: event.target.value })} required>
        <option value="">선택해 주세요</option>
        {Object.entries(GENDER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <div><label htmlFor={`${prefix}-age`}>나이</label><div className="start-age-field"><input id={`${prefix}-age`} name="age" type="number" min={6} max={120} inputMode="numeric" value={profile.age} onChange={(event) => onChange({ ...profile, age: event.target.value })} placeholder="나이" required /><span>세</span></div></div>
    </div>
  </>;
}
