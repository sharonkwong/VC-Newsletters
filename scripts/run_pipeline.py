#!/usr/bin/env python3
"""
Full Newsletter Pipeline
=========================
Runs the complete pipeline: generate → validate.

Usage:
    python3 run_pipeline.py "climate tech"
    python3 run_pipeline.py "whale migration"
"""

import sys
from generate_newsletter import run_pipeline as generate
from validate_newsletter import run_validation as validate


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 run_pipeline.py \"<topic>\"")
        print("Example: python3 run_pipeline.py \"whale migration\"")
        print()
        print("This runs two steps:")
        print("  1. generate_newsletter.py — scrape, collect, analyze")
        print("  2. validate_newsletter.py — fact-check, correct, supplement")
        sys.exit(1)

    topic = sys.argv[1].strip()
    if not topic:
        print("Error: topic cannot be empty.")
        sys.exit(1)

    print()
    print("=" * 60)
    print(f"  STEP 1: Generating newsletter for \"{topic}\"")
    print("=" * 60)
    print()
    generate(topic)

    print()
    print("=" * 60)
    print(f"  STEP 2: Validating & fact-checking \"{topic}\"")
    print("=" * 60)
    print()
    validate(topic)

    print()
    print("=" * 60)
    print("  DONE — Newsletter generated and validated!")
    print("=" * 60)


if __name__ == "__main__":
    main()
