import React from 'react';
import { APP_TITLE } from '../../constants';

export const Footer = () => (
    <footer className="mt-auto py-8 text-center text-[#CCBBA9] text-xs border-t border-[#EBE5E0] w-full print:hidden">
        <p className="mb-2">© {new Date().getFullYear()} {APP_TITLE}</p>
        <a href="https://paraplanner.ru" target="_blank" rel="noreferrer" className="hover:text-[#936142] transition-colors border-b border-transparent hover:border-[#936142]">
            paraplanner.ru
        </a>
    </footer>
);