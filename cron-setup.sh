#!/bin/bash

# Email Campaigns Cron Job Setup Script
# This script helps set up cron jobs for email campaigns

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log"
PROJECT_NAME="professional-diver-training"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📧 Email Campaigns Cron Job Setup${NC}"
echo ""

# Check if running as root (needed for system-wide cron)
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}⚠️  Not running as root. Setting up user cron jobs instead.${NC}"
  CRON_USER=$(whoami)
else
  CRON_USER="root"
fi

# Create log directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
  echo -e "${YELLOW}Creating log directory: $LOG_DIR${NC}"
  mkdir -p "$LOG_DIR"
fi

# Create cron job entries
FOLLOW_UP_CRON="0 9 * * * cd $SCRIPT_DIR && npm run email-campaigns:follow-up >> $LOG_DIR/${PROJECT_NAME}-followup.log 2>&1"
TESTIMONIAL_CRON="0 10 * * 1 cd $SCRIPT_DIR && npm run email-campaigns:testimonial >> $LOG_DIR/${PROJECT_NAME}-testimonial.log 2>&1"

echo -e "${GREEN}Suggested cron jobs:${NC}"
echo ""
echo -e "${YELLOW}Follow-up emails (daily at 9 AM):${NC}"
echo "$FOLLOW_UP_CRON"
echo ""
echo -e "${YELLOW}Testimonial promo (weekly on Monday at 10 AM):${NC}"
echo "$TESTIMONIAL_CRON"
echo ""

# Ask if user wants to add these to crontab
read -p "Do you want to add these cron jobs? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Backup existing crontab
  crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
  
  # Add new cron jobs
  (crontab -l 2>/dev/null; echo ""; echo "# Email Campaigns - $PROJECT_NAME"; echo "$FOLLOW_UP_CRON"; echo "$TESTIMONIAL_CRON") | crontab -
  
  echo -e "${GREEN}✅ Cron jobs added successfully!${NC}"
  echo ""
  echo "View your crontab with: crontab -l"
  echo "Edit crontab with: crontab -e"
  echo "Remove all cron jobs with: crontab -r"
else
  echo -e "${YELLOW}To add manually, run:${NC}"
  echo "crontab -e"
  echo ""
  echo "Then add these lines:"
  echo "$FOLLOW_UP_CRON"
  echo "$TESTIMONIAL_CRON"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"





