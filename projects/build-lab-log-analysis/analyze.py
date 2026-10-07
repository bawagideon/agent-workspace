import sys

def analyze_logs(file_path):
    print(f'Analyzing log file: {file_path}')
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()
        for i, line in enumerate(lines, 1):
            print(f'Line {i}: {line.strip()}')
    except Exception as e:
        print(f'Error reading file: {e}')

if __name__ == '__main__':
    log_file = 'projects/build-lab-log-analysis/sample.log'
    analyze_logs(log_file)
