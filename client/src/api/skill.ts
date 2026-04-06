import { BASE_URL } from '.';

export interface ISkill {
  _id: string;
  name: string;
  category: string;
  icon_name?: string;
}

export const getAllSkills = async (): Promise<ISkill[]> => {
  try {
    const res = await fetch(`${BASE_URL}/skills`, {
      method: 'GET',
    });

    if (!res.ok) {
      console.error('Failed to fetch skills');
      return [];
    }

    const data: ISkill[] = await res.json();
    return data;
  } catch (err) {
    console.error('Fetch all skills error:', err);
    return [];
  }
};
