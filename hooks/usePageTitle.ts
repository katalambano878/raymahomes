'use client';

import { useEffect } from 'react';

const SITE_NAME = 'Rayma Kitchenware';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Premium Kitchenware & Home Appliances`;
  }, [title]);
}
