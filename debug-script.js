// Simulate the exact data generation from index.html
function generateSampleData(count = 5) {
    const names = ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Brown', 'Charlie Davis'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
    const locations = ['New York', 'San Francisco', 'London', 'Tokyo', 'Sydney'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Suspended'];
    
    const data = [];
    for (let i = 1; i <= count; i++) {
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date(2024, 11, 31);
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        
        data.push({
            id: i,
            name: names[Math.floor(Math.random() * names.length)],
            department: departments[Math.floor(Math.random() * departments.length)],
            location: locations[Math.floor(Math.random() * locations.length)],
            salary: Math.floor(Math.random() * 150000) + 50000,
            experience: Math.floor(Math.random() * 20) + 1,
            joinDate: randomDate.toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            performance: Math.floor(Math.random() * 100) + 1
        });
    }
    return data;
}

// Column definitions from index.html
const columns = [
    {
        key: 'salary',
        title: 'Salary',
        dataIndex: 'salary',
        render: (value) => `$${value.toLocaleString()}`
    },
    {
        key: 'experience',
        title: 'Experience (Years)',
        dataIndex: 'experience', 
        render: (value) => `${value} years`
    }
];

// The two isNumericColumn methods from the code
function isNumericColumn_TableUtils(column, data) {
    return data.slice(0, 10).every(row => {
        const value = row[column.dataIndex];
        return value === null || value === undefined || value === '' || !isNaN(Number(value));
    });
}

function isNumericColumn_ExceLikeTable(column, data) {
    const sampleValue = data[0]?.[column.dataIndex];
    return typeof sampleValue === 'number' || !isNaN(Number(sampleValue));
}

// Generate test data
const testData = generateSampleData(5);

console.log('=== DEBUGGING isNumericColumn ISSUE ===\n');
console.log('Test Data (First 5 rows):');
console.log(JSON.stringify(testData, null, 2));
console.log('\n=== COLUMN ANALYSIS ===\n');

columns.forEach(column => {
    const firstRowValue = testData[0]?.[column.dataIndex];
    const tableUtilsResult = isNumericColumn_TableUtils(column, testData);
    const exceLikeTableResult = isNumericColumn_ExceLikeTable(column, testData);
    
    console.log(`${column.title} (${column.key}):`);
    console.log(`  First row value: ${firstRowValue} (type: ${typeof firstRowValue})`);
    console.log(`  TableUtils.isNumericColumn: ${tableUtilsResult}`);
    console.log(`  ExceLikeTable.isNumericColumn: ${exceLikeTableResult}`);
    console.log(`  Match: ${tableUtilsResult === exceLikeTableResult ? '✅ YES' : '❌ NO'}`);
    
    if (column.render) {
        const renderedValue = column.render(firstRowValue);
        console.log(`  Rendered value: "${renderedValue}" (type: ${typeof renderedValue})`);
        console.log(`  isNaN(Number(renderedValue)): ${isNaN(Number(renderedValue))}`);
    }
    console.log('');
});