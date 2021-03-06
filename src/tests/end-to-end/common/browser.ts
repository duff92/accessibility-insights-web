// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Puppeteer from 'puppeteer';
import { browserLogPath } from './browser-factory';
import { forceTestFailure } from './force-test-failure';
import { BackgroundPage, isBackgroundPageTarget } from './page-controllers/background-page';
import { ContentPage, contentPageRelativeUrl } from './page-controllers/content-page';
import { DetailsViewPage, detailsViewRelativeUrl } from './page-controllers/details-view-page';
import { Page } from './page-controllers/page';
import { PopupPage, popupPageRelativeUrl } from './page-controllers/popup-page';
import { TargetPage, targetPageUrl, TargetPageUrlOptions } from './page-controllers/target-page';

export class Browser {
    private memoizedBackgroundPage: BackgroundPage;
    private pages: Array<Page> = [];

    constructor(
        private readonly browserInstanceId: string,
        private readonly underlyingBrowser: Puppeteer.Browser,
        private readonly onClose?: () => Promise<void>,
    ) {
        underlyingBrowser.on('disconnected', onBrowserDisconnected);
    }

    public async close(): Promise<void> {
        if (this.onClose) {
            await this.onClose();
        }

        this.underlyingBrowser.removeListener('disconnected', onBrowserDisconnected);
        await this.underlyingBrowser.close();
    }

    public async backgroundPage(): Promise<BackgroundPage> {
        if (this.memoizedBackgroundPage) {
            return this.memoizedBackgroundPage;
        }

        const backgroundPageTarget = await this.underlyingBrowser.waitForTarget(
            isBackgroundPageTarget,
        );

        this.memoizedBackgroundPage = new BackgroundPage(await backgroundPageTarget.page(), {
            onPageCrash: this.onPageCrash,
        });

        return this.memoizedBackgroundPage;
    }

    public async newPage(url: string): Promise<Page> {
        const underlyingPage = await this.underlyingBrowser.newPage();
        const page = new Page(underlyingPage, { onPageCrash: this.onPageCrash });
        this.pages.push(page);
        await page.goto(url);
        return page;
    }

    public async newTargetPage(urlOptions?: TargetPageUrlOptions): Promise<TargetPage> {
        const underlyingPage = await this.underlyingBrowser.newPage();
        await underlyingPage.bringToFront();
        const tabId = await this.getActivePageTabId();
        const targetPage = new TargetPage(underlyingPage, tabId);
        this.pages.push(targetPage);
        await targetPage.goto(targetPageUrl(urlOptions));
        return targetPage;
    }

    public async newPopupPage(targetPage: TargetPage): Promise<PopupPage> {
        const underlyingPage = await this.underlyingBrowser.newPage();
        const page = new PopupPage(underlyingPage, { onPageCrash: this.onPageCrash });
        const url = await this.getExtensionUrl(popupPageRelativeUrl(targetPage.tabId));
        this.pages.push(page);
        await page.goto(url);
        return page;
    }

    public async newDetailsViewPage(targetPage: TargetPage): Promise<DetailsViewPage> {
        const underlyingPage = await this.underlyingBrowser.newPage();
        const page = new DetailsViewPage(underlyingPage, { onPageCrash: this.onPageCrash });
        const url = await this.getExtensionUrl(detailsViewRelativeUrl(targetPage.tabId));
        this.pages.push(page);
        await page.goto(url);
        return page;
    }

    public async waitForDetailsViewPage(targetPage: TargetPage): Promise<DetailsViewPage> {
        const expectedUrl = await this.getExtensionUrl(detailsViewRelativeUrl(targetPage.tabId));
        const underlyingTarget = await this.underlyingBrowser.waitForTarget(
            t => t.url().toLowerCase() === expectedUrl.toLowerCase(),
        );
        const underlyingPage = await underlyingTarget.page();
        const page = new DetailsViewPage(underlyingPage, { onPageCrash: this.onPageCrash });
        this.pages.push(page);
        return page;
    }

    public async newContentPage(contentPath: string): Promise<ContentPage> {
        const underlyingPage = await this.underlyingBrowser.newPage();
        const page = new ContentPage(underlyingPage, { onPageCrash: this.onPageCrash });
        const url = await this.getExtensionUrl(contentPageRelativeUrl(contentPath));
        this.pages.push(page);
        await page.goto(url);
        return page;
    }

    public async gotoContentPage(existingPage: ContentPage, newContentPath: string): Promise<void> {
        const url = await this.getExtensionUrl(contentPageRelativeUrl(newContentPath));
        await existingPage.goto(url);
    }

    public async closeAllPages(): Promise<void> {
        for (let pos = 0; pos < this.pages.length; pos++) {
            await this.pages[pos].close(true);
        }
    }

    public async setHighContrastMode(highContrastMode: boolean): Promise<void> {
        const backgroundPage = await this.backgroundPage();
        await backgroundPage.setHighContrastMode(highContrastMode);
    }

    private async getActivePageTabId(): Promise<number> {
        const backgroundPage = await this.backgroundPage();
        return await backgroundPage.evaluate(() => {
            return new Promise(resolve => {
                chrome.tabs.query({ active: true, currentWindow: true }, tabs =>
                    resolve(tabs[0].id),
                );
            });
        });
    }

    private async getExtensionUrl(relativePath: string): Promise<string> {
        const backgroundPage = await this.backgroundPage();
        const pageUrl = backgroundPage.url();

        // pageUrl.origin would be correct here, but it doesn't get populated correctly in all node.js versions we build
        return `${pageUrl.protocol}//${pageUrl.host}/${relativePath}`;
    }

    private onPageCrash = () => {
        const errorMessage = `!!! Browser.onPageCrashed: see detailed chrome logs '${browserLogPath(
            this.browserInstanceId,
        )}'`;
        console.error(errorMessage);
    };
}

function onBrowserDisconnected(): void {
    const errorMessage = `Browser disconnected unexpectedly; test results past this point should not be trusted. This probably means that either:
            - BrowserController's browser instance was .close() or .disconnect()ed without going through BrowserController.tearDown()
            - Chromium crashed (this is most commonly an out-of-memory issue)`;

    // This is best-effort - in many/most cases, a disconnected browser will cause an async puppeteer operation in
    // progress to fail (causing a test failure with a less useful error message) before this handler gets called.
    forceTestFailure(errorMessage);
}
