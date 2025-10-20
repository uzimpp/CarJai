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

// ExtractChassisFromInspection extracts chassis/VIN from scraped key-value map
func (s *ScraperService) ExtractChassisFromInspection(kv map[string]string) string {
	// Common Thai keys for chassis; expand as necessary
	keys := []string{"เลขตัวถัง", "เลขตัวรถ", "เลขถังรถ", "VIN", "Chassis"}
	for _, k := range keys {
		if v, ok := kv[k]; ok {
			return strings.TrimSpace(v)
		}
	}
	// Fallback: scan for possible VIN-like values (alphanumeric length >= 8)
	for _, v := range kv {
		vv := strings.TrimSpace(v)
		if len(vv) >= 8 {
			return vv
		}
	}
	return ""
}

// ExtractColorsFromInspection extracts up to 3 color labels (Thai/English) in order of importance
func (s *ScraperService) ExtractColorsFromInspection(kv map[string]string) []string {
	// Try common keys
	keys := []string{"สีรถ", "สี", "Color", "Colours"}
	for _, k := range keys {
		if v, ok := kv[k]; ok {
			v = strings.TrimSpace(v)
			if v == "" {
				continue
			}
			// Split by comma/space if multiple colors are provided
			parts := strings.FieldsFunc(v, func(r rune) bool { return r == ',' || r == '/' || r == '|' })
			out := []string{}
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p == "" {
					continue
				}
				out = append(out, p)
				if len(out) == 3 {
					break
				}
			}
			if len(out) > 0 {
				return out
			}
		}
	}
	return []string{}
}
