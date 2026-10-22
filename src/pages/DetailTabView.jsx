import { useOutletContext } from 'react-router-dom';

export default function DetailTabView({ view }) {
  const views = useOutletContext();
  return views?.[view] ?? null;
}
