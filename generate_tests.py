#!/usr/bin/env python3
"""
Script để phân tích 40 FUNC từ markdown và sinh ra C# test code
"""
import re
import os
from typing import Dict, List, Any

def parse_markdown_file(file_path: str) -> Dict[str, Any]:
    """Phân tích file markdown để lấy thông tin các FUNC"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    functions = {}
    
    # Tìm tất cả các FUNC
    func_pattern = r'## FUNC_(\d+)\s*\n(.*?)(?=## FUNC_|\Z)'
    func_matches = re.findall(func_pattern, content, re.DOTALL)
    
    for func_num, func_content in func_matches:
        func_info = parse_function_content(func_content)
        func_info['number'] = func_num
        functions[f'FUNC_{func_num}'] = func_info
    
    return functions

def parse_function_content(content: str) -> Dict[str, Any]:
    """Phân tích nội dung của một FUNC"""
    lines = content.strip().split('\n')
    
    function_info = {
        'name': '',
        'created_by': '',
        'test_requirement': '',
        'total_test_cases': 0,
        'utc_ids': [],
        'preconditions': [],
        'inputs': {},
        'expected_returns': [],
        'exceptions': [],
        'database_changes': []
    }
    
    # Tìm function name
    for line in lines:
        if 'Function Name' in line and '|' in line:
            parts = line.split('|')
            for i, part in enumerate(parts):
                if 'Function Name' in part and i + 1 < len(parts):
                    # Tìm tên function trong các cột tiếp theo
                    for j in range(i + 1, len(parts)):
                        func_name = parts[j].strip()
                        if func_name and func_name not in ['', 'Function Name', 'Unnamed']:
                            function_info['name'] = func_name
                            break
                    break
    
    # Tìm test requirement
    for line in lines:
        if 'Test requirement' in line and '|' in line:
            parts = line.split('|')
            for part in parts:
                if part.strip() and 'Test requirement' not in part and 'Unnamed' not in part:
                    function_info['test_requirement'] = part.strip()
                    break
    
    # Tìm UTCID columns
    for line in lines:
        if 'UTCID' in line:
            utc_pattern = r'UTCID(\d+)'
            utc_matches = re.findall(utc_pattern, line)
            function_info['utc_ids'] = [f'UTCID{num}' for num in sorted(utc_matches)]
            function_info['total_test_cases'] = len(utc_matches)
            break
    
    # Parse table content để tìm inputs, preconditions, etc.
    in_input_section = False
    in_precondition_section = False
    in_confirm_section = False
    current_input_param = None
    
    for line in lines:
        if '|' not in line:
            continue
            
        parts = [part.strip() for part in line.split('|')]
        
        if len(parts) < 3:
            continue
            
        first_col = parts[1] if len(parts) > 1 else ''
        second_col = parts[2] if len(parts) > 2 else ''
        third_col = parts[3] if len(parts) > 3 else ''
        
        # Check for section headers
        if 'Precondition' in first_col:
            in_precondition_section = True
            in_input_section = False
            in_confirm_section = False
            continue
        elif 'Input' in first_col:
            in_input_section = True
            in_precondition_section = False
            in_confirm_section = False
            continue
        elif 'Return' in first_col or 'Exception' in first_col or 'Database changes' in first_col:
            in_confirm_section = True
            in_input_section = False
            in_precondition_section = False
            continue
        elif 'Result' in first_col:
            in_input_section = False
            in_precondition_section = False
            in_confirm_section = False
            continue
        
        # Parse preconditions
        if in_precondition_section and third_col:
            function_info['preconditions'].append(third_col)
        
        # Parse inputs
        if in_input_section:
            if first_col and first_col not in ['', 'Input'] and not first_col.startswith('Unnamed'):
                # This is a parameter name
                current_input_param = first_col
                function_info['inputs'][current_input_param] = []
            elif third_col and current_input_param:
                # This is a value for the current parameter
                function_info['inputs'][current_input_param].append(third_col)
        
        # Parse returns/exceptions
        if in_confirm_section:
            if 'Exception' in first_col and third_col:
                function_info['exceptions'].append(third_col)
            elif ('Return' in first_col or 'result' in first_col.lower()) and third_col:
                function_info['expected_returns'].append(third_col)
            elif 'Database changes' in first_col and third_col:
                function_info['database_changes'].append(third_col)
    
    return function_info

def generate_csharp_test_class(functions: Dict[str, Any]) -> str:
    """Sinh ra C# test class từ thông tin các functions"""
    
    template = '''using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Entities;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace Tests
{{
    [TestClass]
    public class GeneratedFunctionTests
    {{
        private static ApplicationDbContext BuildDb(string name)
        {{
            var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(name)
                .Options;
            return new ApplicationDbContext(opts);
        }}

{test_methods}
    }}
}}'''

    test_methods = []
    
    for func_key, func_info in functions.items():
        # Sinh test methods cho mỗi FUNC
        for i, utc_id in enumerate(func_info['utc_ids']):
            test_method = generate_test_method(func_key, func_info, utc_id, i + 1)
            test_methods.append(test_method)
    
    return template.format(test_methods='\n\n'.join(test_methods))

def generate_test_method(func_key: str, func_info: Dict[str, Any], utc_id: str, test_index: int) -> str:
    """Sinh ra một test method"""
    
    func_name = func_info.get('name', 'UnknownFunction')
    func_num = func_info.get('number', '00')
    
    # Tạo tên test method
    test_name = f"{func_key}_{utc_id}_{func_name}_{get_test_scenario(test_index)}"
    
    # Tạo input parameters
    input_setup = generate_input_setup(func_info, test_index)
    
    # Tạo expected result
    expected_result = generate_expected_result(func_info, test_index)
    
    template = f'''        [TestMethod]
        public async Task {test_name}()
        {{
            // Arrange
            var db = BuildDb(nameof({test_name}));
            {input_setup}
            
            // TODO: Setup service dependencies and mocks
            // var service = BuildService(db);
            
            // Act & Assert
            {expected_result}
            
            // TODO: Verify database changes if any
        }}'''
    
    return template

def generate_input_setup(func_info: Dict[str, Any], test_index: int) -> str:
    """Sinh setup code cho inputs"""
    setup_lines = []
    
    for param_name, param_values in func_info['inputs'].items():
        if param_values:
            # Lấy giá trị tương ứng với test case
            value_index = min(test_index - 1, len(param_values) - 1)
            param_value = param_values[value_index] if value_index >= 0 else param_values[0]
            
            # Convert value to C# format
            if param_value.isdigit():
                setup_lines.append(f'            var {param_name.lower()} = {param_value};')
            elif '@' in param_value:  # Email
                setup_lines.append(f'            var {param_name.lower()} = "{param_value}";')
            elif any(word in param_value.lower() for word in ['true', 'false']):
                bool_val = 'true' if 'true' in param_value.lower() else 'false'
                setup_lines.append(f'            var {param_name.lower()} = {bool_val};')
            else:
                setup_lines.append(f'            var {param_name.lower()} = "{param_value}";')
    
    return '\n'.join(setup_lines) if setup_lines else '            // No input parameters defined'

def generate_expected_result(func_info: Dict[str, Any], test_index: int) -> str:
    """Sinh expected result code"""
    
    if func_info['exceptions']:
        # Nếu có exception expected
        exception_msg = func_info['exceptions'][0] if func_info['exceptions'] else 'Exception expected'
        return f'''            // Expected exception: {exception_msg}
            // await Assert.ThrowsExceptionAsync<ApiException>(() => service.Method(params));'''
    
    if func_info['expected_returns']:
        # Nếu có return value expected
        return_msg = func_info['expected_returns'][0] if func_info['expected_returns'] else 'Success'
        return f'''            // Expected return: {return_msg}
            // var result = await service.Method(params);
            // Assert.IsNotNull(result);'''
    
    return '''            // TODO: Add specific assertions based on test requirements'''

def get_test_scenario(test_index: int) -> str:
    """Lấy tên scenario cho test"""
    scenarios = ['Success', 'InvalidInput', 'NotFound', 'ValidationError', 'Boundary']
    return scenarios[(test_index - 1) % len(scenarios)]

def main():
    """Main function"""
    markdown_file = '/Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/Bản sao FUNC_01_40.md'
    
    print("Đang phân tích file markdown...")
    functions = parse_markdown_file(markdown_file)
    
    print(f"Tìm thấy {len(functions)} functions:")
    for func_key, func_info in functions.items():
        print(f"  {func_key}: {func_info['name']} ({func_info['total_test_cases']} test cases)")
    
    print("\nĐang sinh ra C# test code...")
    test_code = generate_csharp_test_class(functions)
    
    output_file = '/Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/Tests/GeneratedFunctionTests.cs'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(test_code)
    
    print(f"Đã sinh ra test code tại: {output_file}")

if __name__ == '__main__':
    main()