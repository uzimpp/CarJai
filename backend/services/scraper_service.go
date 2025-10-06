// services/scraper_service.go
package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"
)

// ... (NewScraperService ยังคงเหมือนเดิม) ...
type ScraperService struct{}
func NewScraperService() *ScraperService {
	return &ScraperService{}
}


// ScrapeInspectionData performs web scraping using a headless browser.
func (s *ScraperService) ScrapeInspectionData(url string) (map[string]string, error) {
	// 👇 [แก้ไข] เพิ่ม Options สำหรับการรันใน Docker
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true), // รันแบบไม่มีหน้าจอ
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true), // สำคัญมากสำหรับการรันใน Docker
		chromedp.Flag("disable-dev-shm-usage", true),
	)

	// สร้าง Context สำหรับ Browser instance พร้อม Options
	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	// สร้าง Tab ใหม่ใน Browser (จาก Allocator Context)
	taskCtx, cancel := chromedp.NewContext(allocCtx, chromedp.WithLogf(log.Printf))
	defer cancel()
    
    // ตั้งค่า Timeout ของ task
    taskCtx, cancel = context.WithTimeout(taskCtx, 30*time.Second)
    defer cancel()


	var htmlContent string
	err := chromedp.Run(taskCtx,
		chromedp.Navigate(url),
		chromedp.WaitVisible(`.card-body .mb-3.row`, chromedp.ByQuery),
		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return nil, fmt.Errorf("could not perform scraping actions: %w", err)
	}

	// ... (ส่วนที่เหลือของฟังก์ชันยังคงเหมือนเดิมทุกประการ) ...
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("could not parse rendered HTML: %w", err)
	}

	data := make(map[string]string)
	doc.Find("#app .card-body .mb-3.row").Each(func(i int, sel *goquery.Selection) {
		key := strings.TrimSpace(sel.Find("label.col-form-label").Text())
		value, exists := sel.Find("input.form-control").Attr("value")
		value = strings.TrimSpace(value)

		if key != "" && exists {
			data[key] = value
		}
	})

	if len(data) == 0 {
		return nil, fmt.Errorf("scraper found no data with the current selector, the target website's HTML structure might have changed")
	}

	return data, nil
}