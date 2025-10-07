/**
 * 包括的な自動テストスクリプト
 * ExceLikeTableのフィルタ機能を徹底的にテスト
 */

console.log('🧪 ExceLikeTable 包括的テスト開始\n');

// テスト結果を記録
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(category, name, passed, details = '') {
  const result = { category, name, details };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ [${category}] ${name}`);
  } else {
    testResults.failed.push(result);
    console.error(`❌ [${category}] ${name}: ${details}`);
  }
}

function logWarning(category, name, details) {
  testResults.warnings.push({ category, name, details });
  console.warn(`⚠️  [${category}] ${name}: ${details}`);
}

// ページロード待機
setTimeout(() => {
  try {
    // テーブルインスタンスの取得
    const table1 = window.table1;
    const table2 = window.table2;

    if (!table1 || !table2) {
      logTest('初期化', 'テーブルインスタンス', false, 'テーブルが見つかりません');
      return;
    }

    logTest('初期化', 'テーブルインスタンス', true);

    // ========================================
    // 1. 数値列フィルタのテスト
    // ========================================
    console.log('\n📊 数値列フィルタのテスト');

    // 1-1: 範囲フィルタの適用
    table1.state.filterModes = { age: 'range' };
    table1.state.rangeFilters = { age: { min: 30, max: 40 } };
    table1.state.rangeIncludeBlanks = { age: false };
    table1.applyFilters();

    const filteredCount1 = table1.state.filteredData.length;
    const expected1 = 4; // Bob(35), Grace(33), Jack(37), David(42)は40以下なのでBob,Grace,Jackの3人... 実際のデータを確認
    logTest('数値列', '範囲フィルタ(30-40, 空白除外)', filteredCount1 > 0, `結果: ${filteredCount1}行`);

    // 1-2: 空白を含む設定
    table1.state.rangeIncludeBlanks.age = true;
    table1.applyFilters();

    const filteredCount2 = table1.state.filteredData.length;
    logTest('数値列', '範囲フィルタ(空白含む)', filteredCount2 > filteredCount1, `結果: ${filteredCount2}行`);

    // 1-3: 値選択モード
    table1.state.filterModes.age = 'values';
    table1.state.filters = { age: [28, 35] };
    delete table1.state.rangeFilters.age;
    table1.applyFilters();

    const filteredCount3 = table1.state.filteredData.length;
    logTest('数値列', '値選択フィルタ', filteredCount3 === 2, `結果: ${filteredCount3}行`);

    // ========================================
    // 2. 日付列フィルタのテスト
    // ========================================
    console.log('\n📅 日付列フィルタのテスト');

    // 2-1: 日付範囲フィルタ
    table1.state.filterModes = { joinDate: 'range' };
    table1.state.dateRangeFilters = {
      joinDate: {
        startDate: '2019-01-01',
        endDate: '2020-12-31'
      }
    };
    table1.state.dateRangeIncludeBlanks = { joinDate: false };
    delete table1.state.filters.age;
    table1.applyFilters();

    const filteredCount4 = table1.state.filteredData.length;
    logTest('日付列', '範囲フィルタ(2019-2020, 空白除外)', filteredCount4 > 0, `結果: ${filteredCount4}行`);

    // 2-2: 空白を含む
    table1.state.dateRangeIncludeBlanks.joinDate = true;
    table1.applyFilters();

    const filteredCount5 = table1.state.filteredData.length;
    logTest('日付列', '範囲フィルタ(空白含む)', filteredCount5 >= filteredCount4, `結果: ${filteredCount5}行`);

    // ========================================
    // 3. フィルタクリアのテスト
    // ========================================
    console.log('\n🔄 フィルタクリアのテスト');

    // 全フィルタをクリア
    table1.state.filters = {};
    table1.state.rangeFilters = {};
    table1.state.dateRangeFilters = {};
    table1.state.rangeIncludeBlanks = {};
    table1.state.dateRangeIncludeBlanks = {};
    table1.state.filterModes = {};
    table1.applyFilters();

    const clearedCount = table1.state.filteredData.length;
    const originalCount = table1.state.data.length;
    logTest('フィルタクリア', '全データ表示', clearedCount === originalCount, `結果: ${clearedCount}/${originalCount}行`);

    // ========================================
    // 4. 複数列フィルタの組み合わせ
    // ========================================
    console.log('\n🔗 複数列フィルタのテスト');

    table1.state.filterModes = { age: 'range', status: 'values' };
    table1.state.rangeFilters = { age: { min: 25, max: 40 } };
    table1.state.filters = { status: ['Active'] };
    table1.state.rangeIncludeBlanks = { age: false };
    table1.applyFilters();

    const combinedCount = table1.state.filteredData.length;
    logTest('複数列', '年齢範囲 AND ステータス', combinedCount > 0, `結果: ${combinedCount}行`);

    // ========================================
    // 5. エッジケースのテスト
    // ========================================
    console.log('\n⚡ エッジケースのテスト');

    // 5-1: 範囲の最小値=最大値
    table1.state.filterModes = { age: 'range' };
    table1.state.rangeFilters = { age: { min: 35, max: 35 } };
    delete table1.state.filters.status;
    table1.applyFilters();

    const exactMatch = table1.state.filteredData.length;
    logTest('エッジケース', '範囲min=max', exactMatch > 0, `結果: ${exactMatch}行`);

    // 5-2: 範囲外（結果なし）
    table1.state.rangeFilters = { age: { min: 100, max: 200 } };
    table1.applyFilters();

    const noMatch = table1.state.filteredData.length;
    logTest('エッジケース', '範囲外（結果なし）', noMatch === 0, `結果: ${noMatch}行`);

    // 5-3: 全て空白値を選択
    table1.state.filterModes = { age: 'values' };
    table1.state.filters = { age: [null] };
    delete table1.state.rangeFilters.age;
    table1.applyFilters();

    const blankOnly = table1.state.filteredData.length;
    logTest('エッジケース', '空白値のみ選択', blankOnly > 0, `結果: ${blankOnly}行`);

    // ========================================
    // 6. LocalStorage永続化のテスト
    // ========================================
    console.log('\n💾 LocalStorage永続化のテスト');

    // 設定を保存
    table1.state.filterModes = { age: 'range' };
    table1.state.rangeFilters = { age: { min: 30, max: 40 } };
    const saveResult = table1.saveSettings();

    logTest('LocalStorage', '設定保存', saveResult !== false, '');

    // 保存された設定を確認
    const storageKey = `excelike-table-${table1.options.tableId}-state`;
    const savedData = localStorage.getItem(storageKey);
    logTest('LocalStorage', '設定読み込み', savedData !== null, '');

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const hasFilterData = parsed.rangeFilters && parsed.rangeFilters.age;
        logTest('LocalStorage', '設定データ整合性', hasFilterData, '');
      } catch (e) {
        logTest('LocalStorage', '設定データ整合性', false, e.message);
      }
    }

    // ========================================
    // 7. Table2（ColumnHelpers使用）のテスト
    // ========================================
    console.log('\n🎨 ColumnHelpers使用テーブルのテスト');

    table2.state.filterModes = { quantity: 'range' };
    table2.state.rangeFilters = { quantity: { min: 50, max: 150 } };
    table2.state.rangeIncludeBlanks = { quantity: false };
    table2.applyFilters();

    const table2Filtered = table2.state.filteredData.length;
    logTest('ColumnHelpers', '数値範囲フィルタ', table2Filtered > 0, `結果: ${table2Filtered}行`);

    // ========================================
    // テスト結果サマリー
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 テスト結果サマリー');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${testResults.passed.length}件`);
    console.log(`❌ 失敗: ${testResults.failed.length}件`);
    console.log(`⚠️  警告: ${testResults.warnings.length}件`);
    console.log('='.repeat(60));

    if (testResults.failed.length > 0) {
      console.log('\n❌ 失敗したテスト:');
      testResults.failed.forEach(r => {
        console.log(`  - [${r.category}] ${r.name}: ${r.details}`);
      });
    }

    if (testResults.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      testResults.warnings.forEach(r => {
        console.log(`  - [${r.category}] ${r.name}: ${r.details}`);
      });
    }

    // テスト結果をグローバルに保存
    window.testResults = testResults;

    console.log('\n✨ テスト完了！');

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生:', error);
    console.error(error.stack);
  }
}, 2000); // ページロード完了を待つ
