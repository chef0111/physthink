import { ChartAreaInteractive } from '@/modules/admin/chart-area-interactive';
import { DataTable } from '@/modules/admin/data-table';
import { SectionCards } from '@/modules/admin/section-cards';

import data from './data.json';

export default function Page() {
  return (
    <>
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={data} />
    </>
  );
}
