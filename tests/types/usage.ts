// Compiled by `tsc --noEmit` (root tsconfig.json, npm run test:types) against the published types.
// Lines marked @ts-expect-error must stay errors: they guard against types becoming too loose.
import ExceLikeTable, { ColumnHelpers, TABLE_CONFIG, type ExceLikeTableColumn } from 'vanillajs-excelike-table';

interface Person {
  id: number;
  name: string;
  age: number;
}

const people: Person[] = [{ id: 1, name: 'Alice', age: 28 }];

// Minimal: data only
new ExceLikeTable('#a', { data: people });

// Column shorthand and partial column objects
const table = new ExceLikeTable<Person>('#b', {
  data: people,
  columns: ['name', { key: 'age', title: 'Age' }, ColumnHelpers.number('age', 'Age')],
  locale: 'ja',
  pagination: { pageSize: 20 },
});

const csv: string = table.exportCSV({ download: false, bom: false });
table.setFilters({ name: ['Alice'] });
table.applyTheme('ocean');
table.setLanguage('en');
const rows: Person[] = table.getData();
const column: ExceLikeTableColumn<Person> = { dataIndex: 'name' };
void csv;
void rows;
void column;
void TABLE_CONFIG;

// @ts-expect-error unknown column key for this row type
new ExceLikeTable<Person>('#c', { data: people, columns: ['salary'] });

// @ts-expect-error only English and Japanese are bundled
table.setLanguage('fr');
