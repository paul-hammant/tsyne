package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/storage"
	"fyne.io/fyne/v2/test"
	"fyne.io/fyne/v2/widget"
)

// Message types for communication
type Message struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

type Response struct {
	ID      string                 `json:"id"`
	Success bool                   `json:"success"`
	Result  map[string]interface{} `json:"result,omitempty"`
	Error   string                 `json:"error,omitempty"`
}

type Event struct {
	Type     string                 `json:"type"`
	WidgetID string                 `json:"widgetId"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// Bridge manages the Fyne app and communication
type Bridge struct {
	app        fyne.App
	windows    map[string]fyne.Window
	widgets    map[string]fyne.CanvasObject
	callbacks  map[string]string // widget ID -> callback ID
	testMode   bool              // true for headless testing
	mu         sync.RWMutex
	writer     *json.Encoder
	widgetMeta map[string]WidgetMetadata      // metadata for testing
	tableData  map[string][][]string          // table ID -> data
	listData   map[string][]string            // list ID -> data
}

// WidgetMetadata stores metadata about widgets for testing
type WidgetMetadata struct {
	Type string
	Text string
}

func NewBridge(testMode bool) *Bridge {
	var fyneApp fyne.App
	if testMode {
		fyneApp = test.NewApp()
	} else {
		fyneApp = app.New()
	}

	return &Bridge{
		app:        fyneApp,
		windows:    make(map[string]fyne.Window),
		widgets:    make(map[string]fyne.CanvasObject),
		callbacks:  make(map[string]string),
		testMode:   testMode,
		writer:     json.NewEncoder(os.Stdout),
		widgetMeta: make(map[string]WidgetMetadata),
		tableData:  make(map[string][][]string),
		listData:   make(map[string][]string),
	}
}

func (b *Bridge) sendEvent(event Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.writer.Encode(event); err != nil {
		log.Printf("Error sending event: %v", err)
	}
}

func (b *Bridge) sendResponse(resp Response) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.writer.Encode(resp); err != nil {
		log.Printf("Error sending response: %v", err)
	}
}

func (b *Bridge) handleMessage(msg Message) {
	switch msg.Type {
	case "createWindow":
		b.handleCreateWindow(msg)
	case "setContent":
		b.handleSetContent(msg)
	case "showWindow":
		b.handleShowWindow(msg)
	case "createButton":
		b.handleCreateButton(msg)
	case "createLabel":
		b.handleCreateLabel(msg)
	case "createEntry":
		b.handleCreateEntry(msg)
	case "createMultiLineEntry":
		b.handleCreateMultiLineEntry(msg)
	case "createPasswordEntry":
		b.handleCreatePasswordEntry(msg)
	case "createSeparator":
		b.handleCreateSeparator(msg)
	case "createHyperlink":
		b.handleCreateHyperlink(msg)
	case "createVBox":
		b.handleCreateVBox(msg)
	case "createHBox":
		b.handleCreateHBox(msg)
	case "createCheckbox":
		b.handleCreateCheckbox(msg)
	case "createSelect":
		b.handleCreateSelect(msg)
	case "createSlider":
		b.handleCreateSlider(msg)
	case "createProgressBar":
		b.handleCreateProgressBar(msg)
	case "createScroll":
		b.handleCreateScroll(msg)
	case "createGrid":
		b.handleCreateGrid(msg)
	case "createCenter":
		b.handleCreateCenter(msg)
	case "createCard":
		b.handleCreateCard(msg)
	case "createAccordion":
		b.handleCreateAccordion(msg)
	case "createForm":
		b.handleCreateForm(msg)
	case "createRadioGroup":
		b.handleCreateRadioGroup(msg)
	case "createSplit":
		b.handleCreateSplit(msg)
	case "createTabs":
		b.handleCreateTabs(msg)
	case "setText":
		b.handleSetText(msg)
	case "getText":
		b.handleGetText(msg)
	case "setProgress":
		b.handleSetProgress(msg)
	case "getProgress":
		b.handleGetProgress(msg)
	case "setChecked":
		b.handleSetChecked(msg)
	case "getChecked":
		b.handleGetChecked(msg)
	case "setSelected":
		b.handleSetSelected(msg)
	case "getSelected":
		b.handleGetSelected(msg)
	case "setValue":
		b.handleSetValue(msg)
	case "getValue":
		b.handleGetValue(msg)
	case "setRadioSelected":
		b.handleSetRadioSelected(msg)
	case "getRadioSelected":
		b.handleGetRadioSelected(msg)
	case "showInfo":
		b.handleShowInfo(msg)
	case "showError":
		b.handleShowError(msg)
	case "showConfirm":
		b.handleShowConfirm(msg)
	case "showFileOpen":
		b.handleShowFileOpen(msg)
	case "showFileSave":
		b.handleShowFileSave(msg)
	case "resizeWindow":
		b.handleResizeWindow(msg)
	case "centerWindow":
		b.handleCenterWindow(msg)
	case "setWindowFullScreen":
		b.handleSetWindowFullScreen(msg)
	case "setMainMenu":
		b.handleSetMainMenu(msg)
	case "createToolbar":
		b.handleCreateToolbar(msg)
	case "createTable":
		b.handleCreateTable(msg)
	case "createList":
		b.handleCreateList(msg)
	case "updateTableData":
		b.handleUpdateTableData(msg)
	case "updateListData":
		b.handleUpdateListData(msg)
	case "setTheme":
		b.handleSetTheme(msg)
	case "getTheme":
		b.handleGetTheme(msg)
	case "setWidgetStyle":
		b.handleSetWidgetStyle(msg)
	case "quit":
		b.handleQuit(msg)
	// Testing methods
	case "findWidget":
		b.handleFindWidget(msg)
	case "clickWidget":
		b.handleClickWidget(msg)
	case "typeText":
		b.handleTypeText(msg)
	case "getWidgetInfo":
		b.handleGetWidgetInfo(msg)
	case "getAllWidgets":
		b.handleGetAllWidgets(msg)
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   fmt.Sprintf("Unknown message type: %s", msg.Type),
		})
	}
}

func (b *Bridge) handleCreateWindow(msg Message) {
	title := msg.Payload["title"].(string)
	windowID := msg.Payload["id"].(string)

	win := b.app.NewWindow(title)

	// Set window size if provided
	if width, ok := msg.Payload["width"].(float64); ok {
		if height, ok := msg.Payload["height"].(float64); ok {
			win.Resize(fyne.NewSize(float32(width), float32(height)))
		}
	}

	// Set fixed size if provided
	if fixedSize, ok := msg.Payload["fixedSize"].(bool); ok && fixedSize {
		win.SetFixedSize(true)
	}

	b.mu.Lock()
	b.windows[windowID] = win
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"windowId": windowID},
	})
}

func (b *Bridge) handleSetContent(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	win, winExists := b.windows[windowID]
	widget, widgetExists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !winExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	if !widgetExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	win.SetContent(widget)
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowWindow(msg Message) {
	windowID := msg.Payload["windowId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	win.Show()
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateButton(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)
	callbackID, hasCallback := msg.Payload["callbackId"].(string)

	btn := widget.NewButton(text, func() {
		if hasCallback {
			b.sendEvent(Event{
				Type:     "callback",
				WidgetID: widgetID,
				Data:     map[string]interface{}{"callbackId": callbackID},
			})
		}
	})

	b.mu.Lock()
	b.widgets[widgetID] = btn
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "button", Text: text}
	if hasCallback {
		b.callbacks[widgetID] = callbackID
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateLabel(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)

	lbl := widget.NewLabel(text)

	b.mu.Lock()
	b.widgets[widgetID] = lbl
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "label", Text: text}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateEntry(msg Message) {
	widgetID := msg.Payload["id"].(string)
	placeholder, _ := msg.Payload["placeholder"].(string)

	entry := widget.NewEntry()
	entry.SetPlaceHolder(placeholder)

	b.mu.Lock()
	b.widgets[widgetID] = entry
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "entry", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateMultiLineEntry(msg Message) {
	widgetID := msg.Payload["id"].(string)
	placeholder, _ := msg.Payload["placeholder"].(string)

	entry := widget.NewMultiLineEntry()
	entry.SetPlaceHolder(placeholder)

	// Set wrapping mode (default to word wrap)
	if wrapping, ok := msg.Payload["wrapping"].(string); ok {
		switch wrapping {
		case "off":
			entry.Wrapping = fyne.TextWrapOff
		case "word":
			entry.Wrapping = fyne.TextWrapWord
		case "break":
			entry.Wrapping = fyne.TextWrapBreak
		}
	}

	b.mu.Lock()
	b.widgets[widgetID] = entry
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "multilineentry", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreatePasswordEntry(msg Message) {
	widgetID := msg.Payload["id"].(string)
	placeholder, _ := msg.Payload["placeholder"].(string)

	entry := widget.NewPasswordEntry()
	entry.SetPlaceHolder(placeholder)

	b.mu.Lock()
	b.widgets[widgetID] = entry
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "passwordentry", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateSeparator(msg Message) {
	widgetID := msg.Payload["id"].(string)

	separator := widget.NewSeparator()

	b.mu.Lock()
	b.widgets[widgetID] = separator
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "separator", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateHyperlink(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)
	urlStr := msg.Payload["url"].(string)

	// Parse URL
	url, err := storage.ParseURI(urlStr)
	if err != nil {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   fmt.Sprintf("Invalid URL: %v", err),
		})
		return
	}

	hyperlink := widget.NewHyperlink(text, url)

	b.mu.Lock()
	b.widgets[widgetID] = hyperlink
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "hyperlink", Text: text}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateVBox(msg Message) {
	widgetID := msg.Payload["id"].(string)
	childIDs, _ := msg.Payload["children"].([]interface{})

	var children []fyne.CanvasObject
	b.mu.RLock()
	for _, childID := range childIDs {
		if child, exists := b.widgets[childID.(string)]; exists {
			children = append(children, child)
		}
	}
	b.mu.RUnlock()

	vbox := container.NewVBox(children...)

	b.mu.Lock()
	b.widgets[widgetID] = vbox
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateHBox(msg Message) {
	widgetID := msg.Payload["id"].(string)
	childIDs, _ := msg.Payload["children"].([]interface{})

	var children []fyne.CanvasObject
	b.mu.RLock()
	for _, childID := range childIDs {
		if child, exists := b.widgets[childID.(string)]; exists {
			children = append(children, child)
		}
	}
	b.mu.RUnlock()

	hbox := container.NewHBox(children...)

	b.mu.Lock()
	b.widgets[widgetID] = hbox
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateCheckbox(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)
	callbackID, hasCallback := msg.Payload["callbackId"].(string)

	check := widget.NewCheck(text, func(checked bool) {
		if hasCallback {
			b.sendEvent(Event{
				Type:     "callback",
				WidgetID: widgetID,
				Data:     map[string]interface{}{"callbackId": callbackID, "checked": checked},
			})
		}
	})

	b.mu.Lock()
	b.widgets[widgetID] = check
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "checkbox", Text: text}
	if hasCallback {
		b.callbacks[widgetID] = callbackID
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateSelect(msg Message) {
	widgetID := msg.Payload["id"].(string)
	optionsInterface, _ := msg.Payload["options"].([]interface{})
	callbackID, hasCallback := msg.Payload["callbackId"].(string)

	// Convert []interface{} to []string
	options := make([]string, len(optionsInterface))
	for i, opt := range optionsInterface {
		options[i] = opt.(string)
	}

	sel := widget.NewSelect(options, func(selected string) {
		if hasCallback {
			b.sendEvent(Event{
				Type:     "callback",
				WidgetID: widgetID,
				Data:     map[string]interface{}{"callbackId": callbackID, "selected": selected},
			})
		}
	})

	b.mu.Lock()
	b.widgets[widgetID] = sel
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "select", Text: ""}
	if hasCallback {
		b.callbacks[widgetID] = callbackID
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateSlider(msg Message) {
	widgetID := msg.Payload["id"].(string)
	min := msg.Payload["min"].(float64)
	max := msg.Payload["max"].(float64)
	callbackID, hasCallback := msg.Payload["callbackId"].(string)

	slider := widget.NewSlider(min, max)

	// Set initial value if provided
	if initialValue, ok := msg.Payload["value"].(float64); ok {
		slider.Value = initialValue
	}

	if hasCallback {
		slider.OnChanged = func(value float64) {
			b.sendEvent(Event{
				Type:     "callback",
				WidgetID: widgetID,
				Data:     map[string]interface{}{"callbackId": callbackID, "value": value},
			})
		}
	}

	b.mu.Lock()
	b.widgets[widgetID] = slider
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "slider", Text: ""}
	if hasCallback {
		b.callbacks[widgetID] = callbackID
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateProgressBar(msg Message) {
	widgetID := msg.Payload["id"].(string)
	infinite, _ := msg.Payload["infinite"].(bool)

	var progressBar fyne.CanvasObject

	if infinite {
		progressBar = widget.NewProgressBarInfinite()
	} else {
		pb := widget.NewProgressBar()
		// Set initial value if provided
		if initialValue, ok := msg.Payload["value"].(float64); ok {
			pb.Value = initialValue
		}
		progressBar = pb
	}

	b.mu.Lock()
	b.widgets[widgetID] = progressBar
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "progressbar", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateScroll(msg Message) {
	widgetID := msg.Payload["id"].(string)
	contentID := msg.Payload["contentId"].(string)

	b.mu.RLock()
	content, exists := b.widgets[contentID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Content widget not found",
		})
		return
	}

	scroll := container.NewScroll(content)

	b.mu.Lock()
	b.widgets[widgetID] = scroll
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "scroll", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateGrid(msg Message) {
	widgetID := msg.Payload["id"].(string)
	columns := int(msg.Payload["columns"].(float64))
	childIDs, _ := msg.Payload["children"].([]interface{})

	var children []fyne.CanvasObject
	b.mu.RLock()
	for _, childID := range childIDs {
		if child, exists := b.widgets[childID.(string)]; exists {
			children = append(children, child)
		}
	}
	b.mu.RUnlock()

	grid := container.NewGridWithColumns(columns, children...)

	b.mu.Lock()
	b.widgets[widgetID] = grid
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "grid", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateCenter(msg Message) {
	widgetID := msg.Payload["id"].(string)
	childID := msg.Payload["childId"].(string)

	b.mu.RLock()
	child, exists := b.widgets[childID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Child widget not found",
		})
		return
	}

	centered := container.NewCenter(child)

	b.mu.Lock()
	b.widgets[widgetID] = centered
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "center", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateCard(msg Message) {
	widgetID := msg.Payload["id"].(string)
	title := msg.Payload["title"].(string)
	subtitle, _ := msg.Payload["subtitle"].(string)
	contentID := msg.Payload["contentId"].(string)

	b.mu.RLock()
	content, exists := b.widgets[contentID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Content widget not found",
		})
		return
	}

	card := widget.NewCard(title, subtitle, content)

	b.mu.Lock()
	b.widgets[widgetID] = card
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "card", Text: title}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateAccordion(msg Message) {
	widgetID := msg.Payload["id"].(string)
	itemsInterface := msg.Payload["items"].([]interface{})

	var accordionItems []*widget.AccordionItem

	for _, itemInterface := range itemsInterface {
		itemData := itemInterface.(map[string]interface{})
		title := itemData["title"].(string)
		contentID := itemData["contentId"].(string)

		b.mu.RLock()
		content, exists := b.widgets[contentID]
		b.mu.RUnlock()

		if exists {
			accordionItem := widget.NewAccordionItem(title, content)
			accordionItems = append(accordionItems, accordionItem)
		}
	}

	accordion := widget.NewAccordion(accordionItems...)

	b.mu.Lock()
	b.widgets[widgetID] = accordion
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "accordion", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateForm(msg Message) {
	widgetID := msg.Payload["id"].(string)
	itemsInterface := msg.Payload["items"].([]interface{})

	var formItems []*widget.FormItem

	for _, itemInterface := range itemsInterface {
		itemData := itemInterface.(map[string]interface{})
		label := itemData["label"].(string)
		widgetIDStr := itemData["widgetId"].(string)

		b.mu.RLock()
		w, exists := b.widgets[widgetIDStr]
		b.mu.RUnlock()

		if exists {
			formItem := widget.NewFormItem(label, w)
			formItems = append(formItems, formItem)
		}
	}

	// Create form with optional submit/cancel handlers
	var onSubmit func()
	var onCancel func()

	if submitCallbackID, ok := msg.Payload["submitCallbackId"].(string); ok {
		onSubmit = func() {
			b.sendEvent(Event{
				Type: "callback",
				Data: map[string]interface{}{"callbackId": submitCallbackID},
			})
		}
	}

	if cancelCallbackID, ok := msg.Payload["cancelCallbackId"].(string); ok {
		onCancel = func() {
			b.sendEvent(Event{
				Type: "callback",
				Data: map[string]interface{}{"callbackId": cancelCallbackID},
			})
		}
	}

	var form *widget.Form
	if onSubmit != nil || onCancel != nil {
		form = &widget.Form{
			Items:    formItems,
			OnSubmit: onSubmit,
			OnCancel: onCancel,
		}
	} else {
		form = &widget.Form{
			Items: formItems,
		}
	}

	b.mu.Lock()
	b.widgets[widgetID] = form
	b.widgetMeta[widgetID] = WidgetMetadata{Type: "form", Text: ""}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleSetText(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	text := msg.Payload["text"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	switch w := widget.(type) {
	case *widget.Label:
		w.SetText(text)
	case *widget.Entry:
		w.SetText(text)
	case *widget.Button:
		w.SetText(text)
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget does not support setText",
		})
		return
	}

	// Update metadata
	b.mu.Lock()
	if meta, exists := b.widgetMeta[widgetID]; exists {
		meta.Text = text
		b.widgetMeta[widgetID] = meta
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleGetText(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	var text string
	switch w := widget.(type) {
	case *widget.Label:
		text = w.Text
	case *widget.Entry:
		text = w.Text
	case *widget.Button:
		text = w.Text
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget does not support getText",
		})
		return
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"text": text},
	})
}

func (b *Bridge) handleSetChecked(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	checked := msg.Payload["checked"].(bool)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if check, ok := widget.(*widget.Check); ok {
		check.SetChecked(checked)
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a checkbox",
		})
	}
}

func (b *Bridge) handleGetChecked(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if check, ok := widget.(*widget.Check); ok {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
			Result:  map[string]interface{}{"checked": check.Checked},
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a checkbox",
		})
	}
}

func (b *Bridge) handleSetSelected(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	selected := msg.Payload["selected"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if sel, ok := widget.(*widget.Select); ok {
		sel.SetSelected(selected)
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a select",
		})
	}
}

func (b *Bridge) handleGetSelected(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if sel, ok := widget.(*widget.Select); ok {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
			Result:  map[string]interface{}{"selected": sel.Selected},
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a select",
		})
	}
}

func (b *Bridge) handleSetValue(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	value := msg.Payload["value"].(float64)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if slider, ok := widget.(*widget.Slider); ok {
		slider.SetValue(value)
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a slider",
		})
	}
}

func (b *Bridge) handleGetValue(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if slider, ok := widget.(*widget.Slider); ok {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
			Result:  map[string]interface{}{"value": slider.Value},
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a slider",
		})
	}
}

func (b *Bridge) handleSetProgress(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	value := msg.Payload["value"].(float64)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if pb, ok := widget.(*widget.ProgressBar); ok {
		pb.SetValue(value)
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a progressbar",
		})
	}
}

func (b *Bridge) handleGetProgress(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if pb, ok := widget.(*widget.ProgressBar); ok {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
			Result:  map[string]interface{}{"value": pb.Value},
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a progressbar",
		})
	}
}

func (b *Bridge) handleShowInfo(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	message := msg.Payload["message"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowInformation(title, message, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowError(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	message := msg.Payload["message"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowError(fmt.Errorf("%s", message), win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowConfirm(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	message := msg.Payload["message"].(string)
	callbackID := msg.Payload["callbackId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowConfirm(title, message, func(confirmed bool) {
		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{"callbackId": callbackID, "confirmed": confirmed},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowFileOpen(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	callbackID := msg.Payload["callbackId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowFileOpen(func(reader fyne.URIReadCloser, err error) {
		var filePath string
		if reader != nil {
			filePath = reader.URI().Path()
			reader.Close()
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"filePath":   filePath,
				"error":      err != nil,
			},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowFileSave(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	callbackID := msg.Payload["callbackId"].(string)
	fileName, _ := msg.Payload["fileName"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowFileSave(func(writer fyne.URIWriteCloser, err error) {
		var filePath string
		if writer != nil {
			filePath = writer.URI().Path()
			writer.Close()
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"filePath":   filePath,
				"error":      err != nil,
			},
		})
	}, win)

	// Set default filename if provided
	if fileName != "" {
		// Note: Fyne doesn't have a direct API to set default filename in ShowFileSave
		// This would need to be enhanced with NewFileSave and SetFileName
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateRadioGroup(msg Message) {
	id := msg.Payload["id"].(string)
	optionsInterface := msg.Payload["options"].([]interface{})

	// Convert []interface{} to []string
	options := make([]string, len(optionsInterface))
	for i, v := range optionsInterface {
		options[i] = v.(string)
	}

	var callbackID string
	hasCallback := false
	if cid, ok := msg.Payload["callbackId"].(string); ok {
		callbackID = cid
		hasCallback = true
	}

	// Create radio group with change callback
	radio := widget.NewRadioGroup(options, func(selected string) {
		if hasCallback {
			b.sendEvent(Event{
				Type: "callback",
				Data: map[string]interface{}{
					"callbackId": callbackID,
					"selected":   selected,
				},
			})
		}
	})

	// Set initial selection if provided
	if initialSelected, ok := msg.Payload["selected"].(string); ok {
		radio.Selected = initialSelected
	}

	b.mu.Lock()
	b.widgets[id] = radio
	b.widgetMeta[id] = WidgetMetadata{
		Type: "radiogroup",
		Text: "", // Radio groups don't have a single text value
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleSetRadioSelected(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	selected := msg.Payload["selected"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if radio, ok := widget.(*widget.RadioGroup); ok {
		radio.SetSelected(selected)
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a radio group",
		})
	}
}

func (b *Bridge) handleGetRadioSelected(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if radio, ok := widget.(*widget.RadioGroup); ok {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
			Result:  map[string]interface{}{"selected": radio.Selected},
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a radio group",
		})
	}
}

func (b *Bridge) handleCreateSplit(msg Message) {
	id := msg.Payload["id"].(string)
	orientation := msg.Payload["orientation"].(string)
	leadingID := msg.Payload["leadingId"].(string)
	trailingID := msg.Payload["trailingId"].(string)

	b.mu.RLock()
	leading, leadingExists := b.widgets[leadingID]
	trailing, trailingExists := b.widgets[trailingID]
	b.mu.RUnlock()

	if !leadingExists || !trailingExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Leading or trailing widget not found",
		})
		return
	}

	var split *container.Split
	if orientation == "horizontal" {
		split = container.NewHSplit(leading, trailing)
	} else {
		split = container.NewVSplit(leading, trailing)
	}

	// Set offset if provided (0.0 to 1.0)
	if offset, ok := msg.Payload["offset"].(float64); ok {
		split.SetOffset(offset)
	}

	b.mu.Lock()
	b.widgets[id] = split
	b.widgetMeta[id] = WidgetMetadata{
		Type: "split",
		Text: "",
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateTabs(msg Message) {
	id := msg.Payload["id"].(string)
	tabsInterface := msg.Payload["tabs"].([]interface{})

	var tabItems []*container.TabItem

	for _, tabInterface := range tabsInterface {
		tabData := tabInterface.(map[string]interface{})
		title := tabData["title"].(string)
		contentID := tabData["contentId"].(string)

		b.mu.RLock()
		content, exists := b.widgets[contentID]
		b.mu.RUnlock()

		if !exists {
			b.sendResponse(Response{
				ID:      msg.ID,
				Success: false,
				Error:   fmt.Sprintf("Tab content widget not found: %s", contentID),
			})
			return
		}

		tabItems = append(tabItems, container.NewTabItem(title, content))
	}

	tabs := container.NewAppTabs(tabItems...)

	// Set location if provided (top, bottom, leading, trailing)
	if location, ok := msg.Payload["location"].(string); ok {
		switch location {
		case "top":
			tabs.SetTabLocation(container.TabLocationTop)
		case "bottom":
			tabs.SetTabLocation(container.TabLocationBottom)
		case "leading":
			tabs.SetTabLocation(container.TabLocationLeading)
		case "trailing":
			tabs.SetTabLocation(container.TabLocationTrailing)
		}
	}

	b.mu.Lock()
	b.widgets[id] = tabs
	b.widgetMeta[id] = WidgetMetadata{
		Type: "tabs",
		Text: "",
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleResizeWindow(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	width := msg.Payload["width"].(float64)
	height := msg.Payload["height"].(float64)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	win.Resize(fyne.NewSize(float32(width), float32(height)))

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCenterWindow(msg Message) {
	windowID := msg.Payload["windowId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	win.CenterOnScreen()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleSetWindowFullScreen(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	fullscreen := msg.Payload["fullscreen"].(bool)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	win.SetFullScreen(fullscreen)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleSetMainMenu(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	menuItemsInterface := msg.Payload["menuItems"].([]interface{})

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	// Build menu structure
	var menus []*fyne.Menu
	for _, menuInterface := range menuItemsInterface {
		menuData := menuInterface.(map[string]interface{})
		label := menuData["label"].(string)
		itemsInterface := menuData["items"].([]interface{})

		var items []*fyne.MenuItem
		for _, itemInterface := range itemsInterface {
			itemData := itemInterface.(map[string]interface{})
			itemLabel := itemData["label"].(string)

			// Check if this is a separator
			if isSeparator, ok := itemData["isSeparator"].(bool); ok && isSeparator {
				items = append(items, fyne.NewMenuItemSeparator())
				continue
			}

			// Regular menu item with callback
			if callbackID, ok := itemData["callbackId"].(string); ok {
				menuItem := fyne.NewMenuItem(itemLabel, func() {
					b.sendEvent(Event{
						Type: "callback",
						Data: map[string]interface{}{
							"callbackId": callbackID,
						},
					})
				})

				// Set disabled state if provided
				if disabled, ok := itemData["disabled"].(bool); ok {
					menuItem.Disabled = disabled
				}

				// Set checked state if provided
				if checked, ok := itemData["checked"].(bool); ok {
					menuItem.Checked = checked
				}

				items = append(items, menuItem)
			}
		}

		menus = append(menus, fyne.NewMenu(label, items...))
	}

	mainMenu := fyne.NewMainMenu(menus...)
	win.SetMainMenu(mainMenu)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateToolbar(msg Message) {
	id := msg.Payload["id"].(string)
	itemsInterface := msg.Payload["items"].([]interface{})

	var toolbarItems []widget.ToolbarItem

	for _, itemInterface := range itemsInterface {
		itemData := itemInterface.(map[string]interface{})
		itemType := itemData["type"].(string)

		switch itemType {
		case "action":
			label := itemData["label"].(string)
			callbackID := itemData["callbackId"].(string)

			action := widget.NewToolbarAction(
				nil, // Icon (we'll keep it simple for now)
				func() {
					b.sendEvent(Event{
						Type: "callback",
						Data: map[string]interface{}{
							"callbackId": callbackID,
						},
					})
				},
			)
			// Store label for reference (Fyne toolbar actions don't show text by default)
			_ = label
			toolbarItems = append(toolbarItems, action)

		case "separator":
			toolbarItems = append(toolbarItems, widget.NewToolbarSeparator())

		case "spacer":
			toolbarItems = append(toolbarItems, widget.NewToolbarSpacer())
		}
	}

	toolbar := widget.NewToolbar(toolbarItems...)

	b.mu.Lock()
	b.widgets[id] = toolbar
	b.widgetMeta[id] = WidgetMetadata{
		Type: "toolbar",
		Text: "",
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateTable(msg Message) {
	id := msg.Payload["id"].(string)
	headersInterface := msg.Payload["headers"].([]interface{})
	dataInterface := msg.Payload["data"].([]interface{})

	// Convert headers
	headers := make([]string, len(headersInterface))
	for i, h := range headersInterface {
		headers[i] = h.(string)
	}

	// Convert data
	var data [][]string
	for _, rowInterface := range dataInterface {
		rowData := rowInterface.([]interface{})
		row := make([]string, len(rowData))
		for j, cell := range rowData {
			row[j] = cell.(string)
		}
		data = append(data, row)
	}

	// Store data
	b.mu.Lock()
	b.tableData[id] = data
	b.mu.Unlock()

	// Create table widget
	table := widget.NewTable(
		func() (int, int) {
			b.mu.RLock()
			defer b.mu.RUnlock()
			tableData := b.tableData[id]
			if len(tableData) == 0 {
				return 1, len(headers) // Just header row
			}
			return len(tableData) + 1, len(headers) // +1 for header
		},
		func() fyne.CanvasObject {
			return widget.NewLabel("")
		},
		func(cell widget.TableCellID, obj fyne.CanvasObject) {
			label := obj.(*widget.Label)
			b.mu.RLock()
			tableData := b.tableData[id]
			b.mu.RUnlock()

			if cell.Row == 0 {
				// Header row
				if cell.Col < len(headers) {
					label.SetText(headers[cell.Col])
					label.TextStyle = fyne.TextStyle{Bold: true}
				}
			} else {
				// Data row
				rowIdx := cell.Row - 1
				if rowIdx < len(tableData) && cell.Col < len(tableData[rowIdx]) {
					label.SetText(tableData[rowIdx][cell.Col])
					label.TextStyle = fyne.TextStyle{}
				}
			}
		},
	)

	b.mu.Lock()
	b.widgets[id] = table
	b.widgetMeta[id] = WidgetMetadata{
		Type: "table",
		Text: "",
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleUpdateTableData(msg Message) {
	id := msg.Payload["id"].(string)
	dataInterface := msg.Payload["data"].([]interface{})

	// Convert data
	var data [][]string
	for _, rowInterface := range dataInterface {
		rowData := rowInterface.([]interface{})
		row := make([]string, len(rowData))
		for j, cell := range rowData {
			row[j] = cell.(string)
		}
		data = append(data, row)
	}

	b.mu.Lock()
	b.tableData[id] = data
	widget, exists := b.widgets[id]
	b.mu.Unlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Table not found",
		})
		return
	}

	if table, ok := widget.(*widget.Table); ok {
		table.Refresh()
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a table",
		})
	}
}

func (b *Bridge) handleCreateList(msg Message) {
	id := msg.Payload["id"].(string)
	itemsInterface := msg.Payload["items"].([]interface{})

	// Convert items
	items := make([]string, len(itemsInterface))
	for i, item := range itemsInterface {
		items[i] = item.(string)
	}

	// Store data
	b.mu.Lock()
	b.listData[id] = items
	b.mu.Unlock()

	// Create list widget
	list := widget.NewList(
		func() int {
			b.mu.RLock()
			defer b.mu.RUnlock()
			return len(b.listData[id])
		},
		func() fyne.CanvasObject {
			return widget.NewLabel("")
		},
		func(itemID widget.ListItemID, obj fyne.CanvasObject) {
			label := obj.(*widget.Label)
			b.mu.RLock()
			listData := b.listData[id]
			b.mu.RUnlock()

			if itemID < len(listData) {
				label.SetText(listData[itemID])
			}
		},
	)

	// Handle selection callback if provided
	if callbackID, ok := msg.Payload["callbackId"].(string); ok {
		list.OnSelected = func(itemID widget.ListItemID) {
			b.mu.RLock()
			listData := b.listData[id]
			b.mu.RUnlock()

			var selectedItem string
			if itemID < len(listData) {
				selectedItem = listData[itemID]
			}

			b.sendEvent(Event{
				Type: "callback",
				Data: map[string]interface{}{
					"callbackId": callbackID,
					"index":      itemID,
					"item":       selectedItem,
				},
			})
		}
	}

	b.mu.Lock()
	b.widgets[id] = list
	b.widgetMeta[id] = WidgetMetadata{
		Type: "list",
		Text: "",
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleUpdateListData(msg Message) {
	id := msg.Payload["id"].(string)
	itemsInterface := msg.Payload["items"].([]interface{})

	// Convert items
	items := make([]string, len(itemsInterface))
	for i, item := range itemsInterface {
		items[i] = item.(string)
	}

	b.mu.Lock()
	b.listData[id] = items
	widget, exists := b.widgets[id]
	b.mu.Unlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "List not found",
		})
		return
	}

	if list, ok := widget.(*widget.List); ok {
		list.Refresh()
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a list",
		})
	}
}

func (b *Bridge) handleSetTheme(msg Message) {
	theme := msg.Payload["theme"].(string)

	var fyneTheme fyne.Theme
	switch theme {
	case "dark":
		fyneTheme = fyne.NewDarkTheme()
	case "light":
		fyneTheme = fyne.NewLightTheme()
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   fmt.Sprintf("Unknown theme: %s. Use 'dark' or 'light'", theme),
		})
		return
	}

	b.app.Settings().SetTheme(fyneTheme)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleGetTheme(msg Message) {
	// Determine current theme by checking app settings
	// Fyne doesn't have a direct "get theme" API, so we'll check the variant
	isDark := b.app.Settings().ThemeVariant() == fyne.ThemeVariantDark

	theme := "light"
	if isDark {
		theme = "dark"
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result: map[string]interface{}{
			"theme": theme,
		},
	})
}

func (b *Bridge) handleSetWidgetStyle(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	// Apply font style if specified
	if fontStyle, ok := msg.Payload["fontStyle"].(string); ok {
		switch w := widget.(type) {
		case *widget.Label:
			switch fontStyle {
			case "bold":
				w.TextStyle = fyne.TextStyle{Bold: true}
			case "italic":
				w.TextStyle = fyne.TextStyle{Italic: true}
			case "bold-italic":
				w.TextStyle = fyne.TextStyle{Bold: true, Italic: true}
			case "normal":
				w.TextStyle = fyne.TextStyle{}
			}
			w.Refresh()
		case *widget.Button:
			switch fontStyle {
			case "bold":
				w.Importance = widget.HighImportance
			}
			w.Refresh()
		}
	}

	// Apply font family if specified
	if fontFamily, ok := msg.Payload["fontFamily"].(string); ok {
		switch w := widget.(type) {
		case *widget.Label:
			if fontFamily == "monospace" || fontFamily == FontFamily.MONOSPACE {
				w.TextStyle.Monospace = true
				w.Refresh()
			}
		case *widget.Entry:
			if fontFamily == "monospace" || fontFamily == FontFamily.MONOSPACE {
				// Entry doesn't directly support monospace, but we can note it
			}
		}
	}

	// Note: Color and backgroundColor styling in Fyne requires custom themes
	// or custom widgets. For now, we acknowledge these but don't apply them
	// as Fyne's standard widgets don't support per-widget color customization
	// without creating custom renderers.

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleQuit(msg Message) {
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
	b.app.Quit()
}

// Testing methods

func (b *Bridge) handleFindWidget(msg Message) {
	selector := msg.Payload["selector"].(string)
	selectorType := msg.Payload["type"].(string)

	b.mu.RLock()
	defer b.mu.RUnlock()

	var matches []string

	for widgetID, meta := range b.widgetMeta {
		switch selectorType {
		case "text":
			if strings.Contains(meta.Text, selector) {
				matches = append(matches, widgetID)
			}
		case "exactText":
			if meta.Text == selector {
				matches = append(matches, widgetID)
			}
		case "type":
			if meta.Type == selector {
				matches = append(matches, widgetID)
			}
		}
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result: map[string]interface{}{
			"widgetIds": matches,
		},
	})
}

func (b *Bridge) handleClickWidget(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	// Simulate click
	if btn, ok := widget.(*widget.Button); ok {
		if b.testMode {
			test.Tap(btn)
		} else {
			// In normal mode, just trigger the callback
			btn.OnTapped()
		}
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not clickable",
		})
	}
}

func (b *Bridge) handleTypeText(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	text := msg.Payload["text"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	if entry, ok := widget.(*widget.Entry); ok {
		if b.testMode {
			test.Type(entry, text)
		} else {
			entry.SetText(text)
		}

		// Update metadata
		b.mu.Lock()
		if meta, exists := b.widgetMeta[widgetID]; exists {
			meta.Text = text
			b.widgetMeta[widgetID] = meta
		}
		b.mu.Unlock()

		b.sendResponse(Response{
			ID:      msg.ID,
			Success: true,
		})
	} else {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget is not a text entry",
		})
	}
}

func (b *Bridge) handleGetWidgetInfo(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, widgetExists := b.widgets[widgetID]
	meta, metaExists := b.widgetMeta[widgetID]
	b.mu.RUnlock()

	if !widgetExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	info := map[string]interface{}{
		"id":   widgetID,
		"type": "unknown",
		"text": "",
	}

	if metaExists {
		info["type"] = meta.Type
		info["text"] = meta.Text
	}

	// Get current text value
	switch w := widget.(type) {
	case *widget.Label:
		info["text"] = w.Text
		info["type"] = "label"
	case *widget.Entry:
		info["text"] = w.Text
		info["type"] = "entry"
		info["placeholder"] = w.PlaceHolder
	case *widget.Button:
		info["text"] = w.Text
		info["type"] = "button"
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  info,
	})
}

func (b *Bridge) handleGetAllWidgets(msg Message) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	widgets := make([]map[string]interface{}, 0)

	for widgetID, meta := range b.widgetMeta {
		widgetInfo := map[string]interface{}{
			"id":   widgetID,
			"type": meta.Type,
			"text": meta.Text,
		}

		// Get current text value
		if widget, exists := b.widgets[widgetID]; exists {
			switch w := widget.(type) {
			case *widget.Label:
				widgetInfo["text"] = w.Text
			case *widget.Entry:
				widgetInfo["text"] = w.Text
			case *widget.Button:
				widgetInfo["text"] = w.Text
			}
		}

		widgets = append(widgets, widgetInfo)
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result: map[string]interface{}{
			"widgets": widgets,
		},
	})
}

func main() {
	// Check for test mode flag
	testMode := false
	for _, arg := range os.Args[1:] {
		if arg == "--test" || arg == "--headless" {
			testMode = true
			break
		}
	}

	bridge := NewBridge(testMode)

	// Read messages from stdin in a goroutine
	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			line := scanner.Text()
			var msg Message
			if err := json.Unmarshal([]byte(line), &msg); err != nil {
				log.Printf("Error parsing message: %v", err)
				continue
			}
			bridge.handleMessage(msg)
		}
	}()

	// Run the Fyne app (blocks until quit)
	bridge.app.Run()
}
