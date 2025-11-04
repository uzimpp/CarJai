import subprocess
import re


def get_git_churn():
    # Execute the Git command to get a list of changes
    result = subprocess.run(
        ['git', 'log', '--shortstat'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    output = result.stdout.decode('utf-8')

    # Parse the output to extract lines added and deleted
    lines_added = 0
    lines_deleted = 0

    for line in output.split('\n'):
        if "insertions(+)" in line:
            # Match pattern like "5 insertions(+)" or "5 insertions(+)"
            match = re.search(r'(\d+)\s+insertions?\(\+\)', line)
            if match:
                lines_added += int(match.group(1))
        if "deletions(-)" in line:
            # Match pattern like "3 deletions(-)" or "3 deletion(-)"
            match = re.search(r'(\d+)\s+deletions?\(\-\)', line)
            if match:
                lines_deleted += int(match.group(1))

    total_churn = lines_added + lines_deleted
    print(
        f"Lines Added: {lines_added}, Lines Deleted: {lines_deleted}, Total Churn: {total_churn}")


# Usage
if __name__ == "__main__":
    get_git_churn()
