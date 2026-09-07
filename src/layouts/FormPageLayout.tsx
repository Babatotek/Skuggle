import React from 'react';
import { PageLayout, type PageLayoutProps } from './PageLayout';
export const FormPageLayout: React.FC<PageLayoutProps> = (props) => <PageLayout {...props} className={`mx-auto w-full max-w-4xl ${props.className ?? ''}`} />;
