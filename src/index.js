/**
 * 配布物の入口。esbuild はここから1本にまとめる（scripts/build.mjs）。
 *
 * 条件付き書式プラグインは globalThis に部品を登録し合う作りなので、
 * 副作用 import として**この順序で**読み込む（順序を変えると部品が見つからない）。
 */
import './plugins/conditional-formatting/constants.js';
import './plugins/conditional-formatting/utils.js';
import './plugins/conditional-formatting/performance-optimizations.js';
import './plugins/conditional-formatting/rule.js';
import './plugins/conditional-formatting/evaluator.js';
import './plugins/conditional-formatting/applier.js';
import './plugins/conditional-formatting/manager.js';
import './plugins/conditional-formatting/ui.js';
import './plugins/conditional-formatting/conditional-formatting.js';

import ExceLikeTable, { ColumnHelpers, TABLE_CONFIG } from './ExceLikeTable.js';

export default ExceLikeTable;
export { ColumnHelpers, TABLE_CONFIG };
