import type { CompareTable as CompareData } from '../lib/schema';

export function CompareTable({ data }: { data: CompareData }) {
  return (
    <table className="compare">
      <thead>
        <tr>
          <th scope="col">Aspect</th>
          <th scope="col">{data.a}</th>
          <th scope="col">{data.b}</th>
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i}>
            <th scope="row">{row.aspect}</th>
            <td>{row.a}</td>
            <td>{row.b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
